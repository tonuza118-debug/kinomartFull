"""Thin client for the SSLCommerz payment gateway (bKash, Nagad, Rocket,
internet banking, and cards, all behind one API — the standard way to accept
online payments from Bangladesh without integrating each mobile wallet
separately).

Two calls matter here:
  1. create_session() — POST to gwprocess/v4/api.php to open a payment
     session and get back a GatewayPageURL to redirect the customer to.
  2. validate_transaction() — GET to validator/api/validationserverAPI.php,
     called server-to-server with the val_id SSLCommerz handed back, to
     confirm a transaction actually happened before trusting it. This is
     mandatory: the success_url redirect alone is just the customer's
     browser being sent back to us and must never be trusted on its own,
     since nothing stops someone from hitting that URL directly.

Reference: https://developer.sslcommerz.com/doc/v4/
"""
import requests
from django.conf import settings


def _api_base():
    return 'https://sandbox.sslcommerz.com' if settings.SSLCOMMERZ_SANDBOX else 'https://securepay.sslcommerz.com'


def create_session(*, tran_id, amount, order):
    """Open a payment session for `amount` (Decimal, BDT) against `order`.

    Returns the parsed JSON response. On success it contains a
    'GatewayPageURL' to redirect the customer's browser to.
    """
    base = _api_base()
    district_name = str(order.district) if order.district_id else 'Dhaka'
    item_titles = ', '.join(order.items.values_list('title', flat=True)[:5]) or 'Kino Mart order'
    payload = {
        'store_id': settings.SSLCOMMERZ_STORE_ID,
        'store_passwd': settings.SSLCOMMERZ_STORE_PASSWORD,
        'total_amount': f'{amount:.2f}',
        'currency': 'BDT',
        'tran_id': tran_id,
        'success_url': f'{settings.BACKEND_URL}/api/payments/success/',
        'fail_url': f'{settings.BACKEND_URL}/api/payments/fail/',
        'cancel_url': f'{settings.BACKEND_URL}/api/payments/cancel/',
        'ipn_url': f'{settings.BACKEND_URL}/api/payments/ipn/',
        # Guest checkout doesn't collect an email, but SSLCommerz requires one —
        # a synthetic, order-scoped address is fine since it's only used for
        # SSLCommerz's own payment-receipt email, not by us.
        'cus_name': order.full_name,
        'cus_email': f'order{order.id}@kinomart.com',
        'cus_add1': (order.address or district_name)[:50],
        'cus_city': district_name[:50],
        'cus_postcode': '1000',
        'cus_country': 'Bangladesh',
        'cus_phone': order.phone_number,
        'shipping_method': 'NO',
        'num_of_item': max(order.items.count(), 1),
        'product_name': item_titles[:255],
        'product_category': 'general',
        'product_profile': 'general',
        # Round-trips back to us on every callback/IPN — handy for audits,
        # not currently relied on for logic (tran_id already ties everything
        # back to the order via the Payment row).
        'value_a': str(order.id),
    }
    resp = requests.post(f'{base}/gwprocess/v4/api.php', data=payload, timeout=20)
    resp.raise_for_status()
    return resp.json()


def validate_transaction(val_id):
    """Server-to-server confirmation of a transaction. Returns parsed JSON;
    check result['status'] in ('VALID', 'VALIDATED') before trusting it."""
    base = _api_base()
    params = {
        'val_id': val_id,
        'store_id': settings.SSLCOMMERZ_STORE_ID,
        'store_passwd': settings.SSLCOMMERZ_STORE_PASSWORD,
        'format': 'json',
    }
    resp = requests.get(f'{base}/validator/api/validationserverAPI.php', params=params, timeout=20)
    resp.raise_for_status()
    return resp.json()
