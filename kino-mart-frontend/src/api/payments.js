import { api } from './client'

// POST /api/payments/initiate/ — opens an SSLCommerz session for an order
// that was just created and returns the URL to send the browser to.
// `phone` must match the order's checkout phone number (same guest-safety
// check used by order tracking).
export async function initiatePayment(orderId, phone) {
  const { data } = await api.post('/payments/initiate/', { order_id: orderId, phone })
  return data // { payment_url }
}
