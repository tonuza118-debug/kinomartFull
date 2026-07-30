import uuid
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework import viewsets, mixins, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PromoBanner, SiteSetting, Order, Wishlist, Cart, CartItem, ContactMessage, Payment
from . import sslcommerz
from catalog.models import Product
from .serializers import (
    PromoBannerSerializer,
    SiteSettingSerializer,
    OrderCreateSerializer,
    OrderListSerializer,
    OrderTrackSerializer,
    WishlistSerializer,
    CartSerializer,
    CouponValidateSerializer,
    ContactMessageSerializer,
)


class PromoBannerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromoBanner.objects.filter(active=True); serializer_class = PromoBannerSerializer; filterset_fields = ['kind']


class SiteSettingViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = SiteSetting.objects.all(); serializer_class = SiteSettingSerializer


class OrderViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderCreateSerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        """GET /api/orders/mine/ — order history for the logged-in customer."""
        orders = Order.objects.filter(user=request.user).prefetch_related('items')
        return Response(OrderListSerializer(orders, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def track(self, request):
        """GET /api/orders/track/?phone=<phone> — guest order lookup by phone.

        No login needed (guest checkout has no account to log into). Returns
        every order placed with that phone number, most recent first.
        """
        phone = request.query_params.get('phone', '').strip()
        if not phone:
            return Response({'detail': 'phone is required.'}, status=status.HTTP_400_BAD_REQUEST)
        orders = Order.objects.filter(phone_number=phone).prefetch_related('items')
        if not orders.exists():
            return Response({'detail': 'No orders found for that phone number.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderTrackSerializer(orders, many=True).data)


class WishlistView(APIView):
    """GET/POST/DELETE /api/wishlist/ — a signed-in customer's saved products.

    POST body: {"product": "<slug>"} to add.
    DELETE with ?product=<slug> to remove one item, or no query param to clear all.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_wishlist(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        return wishlist

    def get(self, request):
        return Response(WishlistSerializer(self.get_wishlist(request)).data)

    def post(self, request):
        slug = request.data.get('product')
        product = Product.objects.filter(slug=slug).first()
        if not product:
            return Response({'product': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        wishlist = self.get_wishlist(request)
        wishlist.products.add(product)
        return Response(WishlistSerializer(wishlist).data)

    def delete(self, request):
        wishlist = self.get_wishlist(request)
        slug = request.query_params.get('product')
        if slug:
            wishlist.products.remove(*wishlist.products.filter(slug=slug))
        else:
            wishlist.products.clear()
        return Response(WishlistSerializer(wishlist).data)


class CartView(APIView):
    """GET/POST/PATCH/DELETE /api/cart/ — a signed-in customer's server-side cart.

    POST body: {"product": "<slug>", "variant_value": "", "quantity": 1} — adds,
    or increments quantity if that product+variant combo is already in the cart.
    PATCH body: same shape, but sets the quantity outright (0 removes the line).
    DELETE with ?product=<slug>&variant_value= to remove one line, or no params to clear.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_cart(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart

    def get(self, request):
        return Response(CartSerializer(self.get_cart(request)).data)

    def post(self, request):
        cart = self.get_cart(request)
        slug = request.data.get('product')
        variant_value = request.data.get('variant_value', '')
        quantity = int(request.data.get('quantity', 1))
        product = Product.objects.filter(slug=slug).first()
        if not product:
            return Response({'product': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        item, created = CartItem.objects.get_or_create(
            cart=cart, product=product, variant_value=variant_value, defaults={'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.save()
        return Response(CartSerializer(cart).data)

    def patch(self, request):
        cart = self.get_cart(request)
        slug = request.data.get('product')
        variant_value = request.data.get('variant_value', '')
        quantity = int(request.data.get('quantity', 1))
        item = CartItem.objects.filter(cart=cart, product__slug=slug, variant_value=variant_value).first()
        if not item:
            return Response({'product': 'That item is not in the cart.'}, status=status.HTTP_404_NOT_FOUND)
        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request):
        cart = self.get_cart(request)
        slug = request.query_params.get('product')
        if slug:
            CartItem.objects.filter(cart=cart, product__slug=slug, variant_value=request.query_params.get('variant_value', '')).delete()
        else:
            cart.items.all().delete()
        return Response(CartSerializer(cart).data)


class ContactMessageView(APIView):
    """POST /api/contact/ — public Contact Us form submission.

    Anyone can submit (guest or logged-in); if the request is authenticated,
    the message is linked to that account for convenience, otherwise it's
    stored with just the name/email/phone the sender typed in.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        serializer.save(user=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PaymentInitiateView(APIView):
    """POST /api/payments/initiate/ — {"order_id": 123, "phone": "01..."}

    Opens an SSLCommerz session for an existing order and returns the URL to
    send the customer's browser to. Public (guest checkout has no account),
    so — same reasoning as order tracking — both the order id and its
    checkout phone number must match, otherwise anyone who knew an order id
    could trigger payment sessions against a stranger's order.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get('order_id')
        phone = str(request.data.get('phone', '')).strip()
        if not order_id or not phone:
            return Response({'detail': 'order_id and phone are both required.'}, status=status.HTTP_400_BAD_REQUEST)
        order = Order.objects.filter(pk=order_id, phone_number=phone).first()
        if not order:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        if order.is_paid:
            return Response({'detail': 'This order is already paid.'}, status=status.HTTP_400_BAD_REQUEST)

        tran_id = f'KM{order.id}{uuid.uuid4().hex[:10]}'.upper()
        try:
            result = sslcommerz.create_session(tran_id=tran_id, amount=order.grand_total, order=order)
        except requests.RequestException:
            return Response({'detail': 'Could not reach the payment gateway. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)

        if result.get('status') != 'SUCCESS' or not result.get('GatewayPageURL'):
            return Response({'detail': result.get('failedreason') or 'Payment session could not be created.'}, status=status.HTTP_502_BAD_GATEWAY)

        order.payment_method = 'online'
        order.save(update_fields=['payment_method'])
        Payment.objects.create(order=order, tran_id=tran_id, amount=order.grand_total)
        return Response({'payment_url': result['GatewayPageURL']})


def _apply_gateway_notification(post_data):
    """Shared by the success/fail/cancel redirect views and the IPN listener.

    Looks up the Payment by tran_id and, if the gateway is reporting success,
    re-confirms it server-to-server via validate_transaction() before trusting
    it — the redirect alone is just the customer's browser bouncing back and
    isn't proof of anything on its own. Idempotent: safe to call twice for the
    same transaction (whichever of the browser redirect or the IPN arrives
    first does the update; the other is a no-op).
    """
    tran_id = post_data.get('tran_id')
    gw_status = (post_data.get('status') or '').upper()
    payment = Payment.objects.select_related('order').filter(tran_id=tran_id).first()
    if not payment or payment.status == 'valid':
        return payment

    if gw_status not in ('VALID', 'VALIDATED'):
        payment.status = {'FAILED': 'failed', 'CANCELLED': 'cancelled', 'EXPIRED': 'expired'}.get(gw_status, 'failed')
        payment.save(update_fields=['status'])
        return payment

    val_id = post_data.get('val_id')
    try:
        validation = sslcommerz.validate_transaction(val_id) if val_id else {}
    except requests.RequestException:
        return payment  # leave as 'initiated' — the IPN (or a retry) will confirm later

    try:
        validated_amount = Decimal(str(validation.get('amount', '0')))
    except InvalidOperation:
        validated_amount = Decimal('0')

    if validation.get('status') not in ('VALID', 'VALIDATED') or validated_amount < payment.amount:
        payment.status = 'failed'
        payment.save(update_fields=['status'])
        return payment

    payment.status = 'valid'
    payment.val_id = val_id
    payment.bank_tran_id = validation.get('bank_tran_id', '')
    payment.method = validation.get('card_type', '')
    payment.validated_at = timezone.now()
    payment.save()

    order = payment.order
    order.is_paid = True
    if order.status == 'pending':
        order.status = 'confirmed'
    order.save(update_fields=['is_paid', 'status'])
    return payment


class PaymentSuccessView(APIView):
    """POST target for SSLCommerz's success_url — the customer's browser
    lands here right after paying. Validates, then bounces them on to the
    frontend with the outcome in the query string."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payment = _apply_gateway_notification(request.data)
        order_id = payment.order_id if payment else request.data.get('value_a', '')
        outcome = 'success' if payment and payment.status == 'valid' else 'failed'
        return HttpResponseRedirect(f'{settings.FRONTEND_URL}/payment-result?status={outcome}&order_id={order_id}')

    def get(self, request):
        return self.post(request)


class PaymentFailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payment = _apply_gateway_notification(request.data)
        order_id = payment.order_id if payment else request.data.get('value_a', '')
        return HttpResponseRedirect(f'{settings.FRONTEND_URL}/payment-result?status=failed&order_id={order_id}')

    def get(self, request):
        return self.post(request)


class PaymentCancelView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payment = _apply_gateway_notification(request.data)
        order_id = payment.order_id if payment else request.data.get('value_a', '')
        return HttpResponseRedirect(f'{settings.FRONTEND_URL}/payment-result?status=cancelled&order_id={order_id}')

    def get(self, request):
        return self.post(request)


class PaymentIPNView(APIView):
    """POST /api/payments/ipn/ — server-to-server notification from
    SSLCommerz. This, not the browser redirects above, is the source of
    truth: it isn't dependent on the customer's browser making it back to
    our site. SSLCommerz doesn't need anything back but a 200."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        _apply_gateway_notification(request.data)
        return Response({'received': True})


class CouponValidateView(APIView):
    """POST /api/coupons/validate/ — {"code": "SAVE10", "subtotal": "1200.00"}"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = serializer.validated_data['coupon']
        subtotal = serializer.validated_data['subtotal']
        discount = (subtotal * coupon.percent_off / 100) + coupon.flat_off
        discount = min(discount, subtotal)
        return Response({
            'code': coupon.code,
            'percent_off': coupon.percent_off,
            'flat_off': str(coupon.flat_off),
            'discount': str(discount),
            'new_total': str(subtotal - discount),
        })
