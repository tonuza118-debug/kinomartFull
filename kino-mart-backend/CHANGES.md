# Kino Mart backend — what changed

Everything below is **new** on top of the backend as originally uploaded. Nothing existing was
removed; guest checkout still works exactly as before.

## Setup after pulling these changes

```bash
cd kino-mart-backend
python -m venv venv && source venv/bin/activate    # if you don't already have one
pip install -r requirements.txt
python manage.py makemigrations catalog accounts storefront
python manage.py migrate
python manage.py runserver
```

`makemigrations` is required — model fields were added (`Product.brand`, `Order.user`) and new
models were created (`Wishlist`, `Cart`, `CartItem`, `Coupon`, `accounts.Profile`). I couldn't run
Django in this sandbox (no network to install it), so these migrations aren't pre-generated —
Django will generate them correctly from the model definitions when you run the command above.

## Product ↔ Brand was never linked — now it is

The original schema had a standalone `Brand` model and a `GET /api/brands/` endpoint, but
`Product` had no foreign key to `Brand` at all — so a "shop by brand" page was impossible no
matter what the frontend did. Added `Product.brand` (nullable FK, same pattern as `category`),
included it in both product serializers, and added it to `ProductViewSet.filterset_fields`, so
`GET /api/products/?brand=<id>` now works and the frontend's new Brands page links to real
filtered results. You'll want to assign a brand to existing products via `/admin/` — they're
currently all unassigned (`brand=null`) since the field didn't exist before.

## New endpoints

### Auth (`djangorestframework-simplejwt`)
| Endpoint | Method | Notes |
|---|---|---|
| `/api/auth/register/` | POST | `{username, email, password, first_name?, last_name?, phone_number?}` |
| `/api/auth/login/` | POST | `{username, password}` → `{access, refresh}` |
| `/api/auth/refresh/` | POST | `{refresh}` → `{access}` |
| `/api/auth/me/` | GET/PATCH | Requires `Authorization: Bearer <access>` |

Access tokens last 7 days, refresh tokens 30 (`SIMPLE_JWT` in `settings.py`) — tune that for a
real production deployment; 7 days is convenience-over-security for a first pass.

### Wishlist & cart (server-side, per logged-in user)
| Endpoint | Method | Notes |
|---|---|---|
| `/api/wishlist/` | GET | Current user's wishlist |
| `/api/wishlist/` | POST | `{product: "<slug>"}` |
| `/api/wishlist/?product=<slug>` | DELETE | Remove one item (omit the param to clear all) |
| `/api/cart/` | GET | Current user's cart |
| `/api/cart/` | POST | `{product, variant_value?, quantity?}` — adds/increments |
| `/api/cart/` | PATCH | Same body — sets quantity outright (`0` removes the line) |
| `/api/cart/?product=<slug>&variant_value=` | DELETE | Remove one line (omit params to clear cart) |

All four require a Bearer token. The frontend keeps a **localStorage-based** cart/wishlist for
guests and only calls these once someone is logged in (see the frontend's `CartContext.jsx`).

### Orders
| Endpoint | Method | Notes |
|---|---|---|
| `/api/orders/` | POST | Unchanged — guest checkout still works. Now also stamps `user` on the order automatically when the requester is authenticated. |
| `/api/orders/mine/` | GET | Order history for the logged-in customer. Requires a Bearer token. |

`OrderCreateSerializer` now also returns `id` and `status` in its response (previously omitted),
so the frontend's order-confirmation screen can show an order number.

### Coupons
| Endpoint | Method | Notes |
|---|---|---|
| `/api/coupons/validate/` | POST | `{code, subtotal}` → `{discount, new_total, ...}` or a 400 with a validation error |

Coupons are managed entirely through Django admin (`/admin/`) — no public list/create endpoint,
since codes shouldn't be enumerable.

### Product search & sort
`GET /api/products/` now also accepts:
- `?search=<text>` — matches against title, short description, and model number
- `?ordering=price` or `?ordering=-price` or `?ordering=created_at` / `-created_at`

on top of the existing `section_type`, `category`, and `in_stock` filters.

### Track my order (guest-friendly, no login)
| Endpoint | Method | Notes |
|---|---|---|
| `/api/orders/track/?phone=<phone>` | GET | Public. Looks up by checkout phone number only and returns every order placed with that number, most recent first (or a 404 if none match). |

Frontend's Track Order page asks for just the phone number and renders every matching order (status, items, totals).

### Contact us
| Endpoint | Method | Notes |
|---|---|---|
| `/api/contact/` | POST | Public. `{name, email, phone_number?, subject?, message}`. If the sender is logged in, the message is linked to their account automatically. |

New `ContactMessage` model, registered read-only in `/admin/` (with `is_resolved` as the one editable field, for triaging). Frontend's Contact page now has a real form instead of a static notice.

### A note on `on_delete` choices
`ContactMessage.user` uses `on_delete=CASCADE` rather than the `SET_NULL` pattern used elsewhere (e.g. `Order.user`). The difference: an order's other fields (address, items, totals) stay meaningful business records after the account is gone, so `Order` keeps its row and just loses the `user` link. A contact message has no such ongoing purpose once its account is deleted — it's just a support ticket with nowhere to route it — so it cascades away instead of accumulating as orphaned rows.

### Online payment (SSLCommerz — cards, bKash, Nagad, Rocket, internet banking)
SSLCommerz is a payment aggregator: one integration gets you cards (VISA/Mastercard/Amex),
all the major mobile wallets, and internet banking, instead of integrating each one separately.
Reference: https://developer.sslcommerz.com/doc/v4/

At checkout the customer now picks **Cash on Delivery** or **Online Payment**. For online:
1. The order is created as usual (`payment_method: 'online'`, `is_paid: false`).
2. `POST /api/payments/initiate/` `{order_id, phone}` opens an SSLCommerz session and returns
   a `payment_url` the browser is redirected to. Like order tracking, `phone` must match the
   order's checkout number — otherwise anyone who knew an order id could trigger a payment
   session against someone else's order.
3. After paying, SSLCommerz redirects the browser to `/api/payments/success|fail|cancel/`,
   which **re-confirms the transaction server-to-server** via SSLCommerz's Validation API
   before trusting it (the redirect alone is just the browser bouncing back and proves
   nothing on its own — this is also why the amount is checked against what we expect).
   The backend then redirects on to the frontend's `/payment-result` page.
4. `POST /api/payments/ipn/` is the same validation logic, but triggered server-to-server by
   SSLCommerz directly rather than via the customer's browser — the authoritative path for
   cases where the customer's connection drops before they're redirected back.

New `Payment` model (one row per attempt, `on_delete=CASCADE` on `order` — a payment record
is meaningless once its order is gone, so it cascades rather than orphaning, same reasoning
as `OrderItem`/`CartItem`). `Order` gained `payment_method` and `is_paid`. All visible/editable
(payments read-only) in `/admin/`.

**Configuration** (`kino_mart_backend/settings.py`, overridable via real environment
variables — `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX`,
`BACKEND_URL`, `FRONTEND_URL`): defaults to SSLCommerz's public sandbox demo store
(`testbox` / `qwerty`), which works immediately against `sandbox.sslcommerz.com` with no
signup — use the sandbox test cards/OTP listed on their docs page to try it end to end.
**For production**, register a live store at https://signup.sslcommerz.com/register and set
real values for those variables (never commit live credentials) plus `SSLCOMMERZ_SANDBOX=False`.

*Note on this environment:* `sandbox.sslcommerz.com` isn't reachable from the sandbox this
was built in, so the initiate/success/fail/cancel/IPN flow was verified with the SSLCommerz
API calls mocked (session creation, validation, amount-mismatch rejection, idempotency) rather
than a live round trip — worth a real end-to-end smoke test once you deploy somewhere with
outbound internet access.

## Everything's still visible/manageable in Django admin

Rather than build a parallel custom "admin dashboard" in React, the new models (`Wishlist`,
`Cart`, `Coupon`) are registered in `storefront/admin.py` alongside the existing ones — Django's
built-in admin at `/admin/` already gives full CRUD, search, and filtering for all of this with
no extra code to maintain. A custom staff-only React panel is a reasonable next step if you want
staff working outside `/admin/`, but it'd be duplicating what's already there rather than adding
new capability — happy to build it if you want it anyway.

## Not included (still open)

- Refresh-token rotation/blacklisting (tokens just expire; there's no server-side revoke).
- Social login (Google/Facebook/Apple) — needs OAuth app registration on each provider, which
  can't be done from inside this sandbox.
- Full-text/typo-tolerant search (Elasticsearch) — `SearchFilter` above is a plain SQL `LIKE`,
  fine for a catalog this size.
