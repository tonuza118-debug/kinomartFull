import { api } from './client'

// GET /api/banners/?kind=hero|offer|promo|special
export async function getBanners(kind) {
  const { data } = await api.get('/banners/', { params: kind ? { kind } : {} })
  return Array.isArray(data) ? data : data.results ?? []
}

// GET /api/settings/  -> list endpoint, backend keeps a single row (pk=1)
export async function getSiteSettings() {
  const { data } = await api.get('/settings/')
  const list = Array.isArray(data) ? data : data.results ?? []
  return (
    list[0] || {
      default_shipping_charge: 60,
      site_name: 'Kino Mart',
      gtm_id: '',
    }
  )
}

// POST /api/orders/
// payload: { full_name, phone_number, district, address, subtotal, shipping_charge, grand_total, items: [...] }
// `district` is matched by name (SlugRelatedField slug_field='name') on the backend.
export async function createOrder(payload) {
  const { data } = await api.post('/orders/', payload)
  return data
}

// GET /api/orders/mine/ — requires auth
export async function getMyOrders() {
  const { data } = await api.get('/orders/mine/')
  return data
}

// GET /api/orders/track/?phone= — public guest lookup by phone, no login needed.
// Returns every order placed with that phone number, most recent first.
export async function trackOrder(phone) {
  const { data } = await api.get('/orders/track/', { params: { phone } })
  return data
}

// POST /api/contact/ — public Contact Us form.
// payload: { name, email, phone_number?, subject?, message }
export async function submitContactMessage(payload) {
  const { data } = await api.post('/contact/', payload)
  return data
}

// --- Wishlist (requires auth) ---
export async function getWishlist() {
  const { data } = await api.get('/wishlist/')
  return data // { products: [...], updated_at }
}
export async function addToWishlist(slug) {
  const { data } = await api.post('/wishlist/', { product: slug })
  return data
}
export async function removeFromWishlist(slug) {
  const { data } = await api.delete('/wishlist/', { params: { product: slug } })
  return data
}

// --- Cart (requires auth) ---
export async function getServerCart() {
  const { data } = await api.get('/cart/')
  return data // { items: [...], subtotal, updated_at }
}
export async function addToServerCart(slug, quantity = 1, variant_value = '') {
  const { data } = await api.post('/cart/', { product: slug, quantity, variant_value })
  return data
}
export async function setServerCartQuantity(slug, quantity, variant_value = '') {
  const { data } = await api.patch('/cart/', { product: slug, quantity, variant_value })
  return data
}
export async function removeFromServerCart(slug, variant_value = '') {
  const { data } = await api.delete('/cart/', { params: { product: slug, variant_value } })
  return data
}
export async function clearServerCart() {
  const { data } = await api.delete('/cart/')
  return data
}

// POST /api/coupons/validate/  { code, subtotal } -> { discount, new_total, ... }
export async function validateCoupon(code, subtotal) {
  const { data } = await api.post('/coupons/validate/', { code, subtotal })
  return data
}
