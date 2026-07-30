# Kino Mart — Frontend

A premium, dark-glass + neon-yellow storefront built with **React 18 + Vite + Tailwind + Framer Motion**,
consuming the Kino Mart **Django REST Framework** backend (see the paired `kino-mart-backend/` +
its `CHANGES.md`).

## Quick start

```bash
cd kino-mart-frontend
npm install
cp .env.example .env
npm run dev
```

By default the Vite dev server proxies `/api` and `/media` to `http://127.0.0.1:8000`. Run the
backend in another terminal (see its `CHANGES.md` for the one-time `makemigrations`/`migrate`
step needed for the new auth/wishlist/cart/coupon/brand features):

```bash
cd kino-mart-backend
source venv/bin/activate
python manage.py migrate
python manage.py runserver
```

Then open `http://localhost:5173`. `CORS_ALLOWED_ORIGINS` already includes it, so no backend
config changes are needed for local dev. For production, set `VITE_API_BASE_URL` and run
`npm run build`; static output lands in `dist/`.

## What this consumes

| Endpoint | Used for |
|---|---|
| `GET /api/categories/`, `/brands/`, `/districts/` | nav, filters, shipping lookup |
| `GET /api/products/?search=&ordering=&section_type=&category=&brand=&in_stock=` | listing, real search, sort, filters |
| `GET /api/products/{slug}/` | product detail |
| `GET /api/banners/?kind=` | hero + promo banners |
| `GET /api/settings/` | site settings (light use so far) |
| `POST /api/orders/` | guest or logged-in checkout (COD) |
| `GET /api/orders/mine/` | order history — requires login |
| `POST /api/auth/register/`, `/login/`, `/refresh/`, `GET/PATCH /api/auth/me/` | accounts |
| `GET/POST/PATCH/DELETE /api/wishlist/`, `/cart/` | server-side wishlist & cart — requires login |
| `POST /api/coupons/validate/` | checkout discount codes |

### Guest vs. logged-in behavior

Cart and wishlist work for **everyone**, logged in or not:

- **Guests**: stored in `localStorage` only (per-browser, not synced).
- **Logged in**: stored on the server via `/api/cart/` and `/api/wishlist/`, so it follows the
  account across devices. Logging in merges whatever was in the guest-session localStorage cart
  and wishlist into the account (see `src/context/CartContext.jsx`), then switches to the server
  as the source of truth.

This logic lives entirely in `CartContext.jsx` — every page (`ProductCard`, `Checkout`,
`Wishlist`, `CartDrawer`, ...) just calls `useCart()` and doesn't need to know which mode is
active.

### Still cosmetic / not backend-wired

- Newsletter signup (`Newsletter.jsx`) — no `/api/newsletter/` endpoint exists yet, so this is a
  local success toast only.
- "Track my order" by phone number (`TrackOrder.jsx`) — no lookup-by-phone endpoint; logged-in
  order history via `/account` works today, phone-based lookup for guests would need a new
  endpoint.
- No custom staff/admin dashboard in React — Django's built-in `/admin/` already has full CRUD
  for every model including the new `Wishlist`, `Cart`, and `Coupon` ones, so a second UI would
  duplicate it rather than add capability. Happy to build one anyway if you want staff working
  outside `/admin/`.

## Structure

```
src/
  api/          axios client (+ JWT attach/refresh) and one file per concern
                (auth.js, catalog.js, storefront.js)
  context/      AuthContext (JWT session) + CartContext (cart/wishlist, server or local)
  components/
    layout/     Navbar, Footer, CartDrawer
    ui/         ProductCard, SectionHeading, CountdownTimer, skeletons, Logo
    home/       Hero, CategoryGrid, ProductRail, PromoBanners, Newsletter, Testimonials
  pages/        Home, Shop, Brands, ProductDetail, Checkout, OrderSuccess, Wishlist,
                Login, Register, Account, static pages
  lib/          formatting helpers (currency, discount %)
```

## Brand

Colors, type, and the glass/neon-yellow direction all come straight from the uploaded
`logo.jpeg` (`#0B0B0B` base, `#E9FF00` neon accent, sharp geometric mark) — see
`tailwind.config.js` for the token set and `src/components/ui/Logo.jsx` for the mark rebuilt in
SVG (so it scales crisply at any size without shipping a raster logo file).
