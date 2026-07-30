import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Loader2, Tag, X } from 'lucide-react'
import { getDistricts } from '../api/catalog'
import { createOrder, validateCoupon } from '../api/storefront'
import { initiatePayment } from '../api/payments'
import { useCart } from '../context/CartContext.jsx'
import { formatBDT } from '../lib/format'
import { mediaUrl } from '../api/client'

export default function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCart()
  const buyNow = location.state?.buyNow

  const lineItems = useMemo(() => {
    if (buyNow) {
      return [
        {
          slug: buyNow.product.slug,
          title: buyNow.product.title,
          price: Number(buyNow.product.price),
          selectedColor: buyNow.variant || '',
          quantity: buyNow.quantity || 1,
          image: buyNow.product.thumbnail || '',
        },
      ]
    }
    return cartItems
  }, [buyNow, cartItems])

  const subtotal = buyNow ? lineItems[0].price * lineItems[0].quantity : cartSubtotal

  const [districts, setDistricts] = useState([])
  const [form, setForm] = useState({ full_name: '', phone_number: '', district: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [couponCode, setCouponCode] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null) // { code, discount }
  const [paymentMethod, setPaymentMethod] = useState('cod') // 'cod' | 'online'

  useEffect(() => {
    getDistricts().then(setDistricts).catch(() => setDistricts([]))
  }, [])

  const selectedDistrict = districts.find((d) => d.name === form.district)
  const shipping = selectedDistrict ? Number(selectedDistrict.shipping_charge) : 0
  const discount = appliedCoupon ? Number(appliedCoupon.discount) : 0
  const grandTotal = Math.max(0, subtotal - discount) + shipping

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setApplyingCoupon(true)
    try {
      const result = await validateCoupon(couponCode.trim(), subtotal.toFixed(2))
      setAppliedCoupon({ code: result.code, discount: Number(result.discount) })
      toast.success(`Coupon ${result.code} applied`)
    } catch (err) {
      toast.error(err.message || 'Invalid coupon code')
    } finally {
      setApplyingCoupon(false)
    }
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate() {
    const next = {}
    if (!form.full_name.trim()) next.full_name = 'Full name is required'
    if (!/^[0-9+\s-]{7,15}$/.test(form.phone_number.trim())) next.phone_number = 'Enter a valid phone number'
    if (!form.district) next.district = 'Select your district'
    if (!form.address.trim()) next.address = 'Delivery address is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(e) {
    e.preventDefault()
    if (lineItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    if (!validate()) return

    setSubmitting(true)
    try {
      const order = await createOrder({
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        district: form.district,
        address: form.address.trim(),
        subtotal: subtotal.toFixed(2),
        shipping_charge: shipping.toFixed(2),
        grand_total: grandTotal.toFixed(2),
        payment_method: paymentMethod,
        items: lineItems.map((i) => ({
          product: i.slug,
          title: i.title,
          price: i.price,
          selected_color: i.selectedColor || '',
          quantity: i.quantity,
          image: i.image || '',
        })),
      })

      if (paymentMethod === 'online') {
        // Stashed so the payment-result page (which the gateway redirects
        // back to as a fresh page load, losing any router state) can look
        // this order up again by phone once payment completes.
        sessionStorage.setItem('kinomart_pending_order', JSON.stringify({ orderId: order.id, phone: form.phone_number.trim() }))
        const { payment_url } = await initiatePayment(order.id, form.phone_number.trim())
        if (!buyNow) await clearCart()
        window.location.href = payment_url
        return
      }

      if (!buyNow) await clearCart()
      navigate('/order-success', { state: { order } })
    } catch (err) {
      toast.error(err.message || 'Could not place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (lineItems.length === 0) {
    return (
      <div className="container-px mx-auto max-w-7xl py-24 text-center">
        <h1 className="font-heading text-2xl font-bold">Nothing to check out</h1>
        <p className="mt-2 text-ink-muted">Add a few products to your cart first.</p>
        <Link to="/shop" className="btn-primary mt-6 inline-flex">Browse products</Link>
      </div>
    )
  }

  return (
    <div className="container-px mx-auto max-w-6xl py-12">
      <Helmet><title>Checkout — Kino Mart</title></Helmet>
      <h1 className="mb-8 font-heading text-2xl font-bold sm:text-3xl">Checkout</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} className="glass-card space-y-5 p-6 sm:p-8">
          <h2 className="font-heading text-lg font-semibold">Delivery details</h2>

          <Field label="Full name" error={errors.full_name}>
            <input
              value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)}
              placeholder="Your name"
              className="input-field"
            />
          </Field>

          <Field label="Phone number" error={errors.phone_number}>
            <input
              value={form.phone_number}
              onChange={(e) => update('phone_number', e.target.value)}
              placeholder="01XXXXXXXXX"
              className="input-field"
            />
          </Field>

          <Field label="District" error={errors.district}>
            <select
              value={form.district}
              onChange={(e) => update('district', e.target.value)}
              className="input-field"
            >
              <option value="" className="bg-base">Select district</option>
              {districts.map((d) => (
                <option key={d.id} value={d.name} className="bg-base">
                  {d.name} — {formatBDT(d.shipping_charge)} shipping
                </option>
              ))}
            </select>
          </Field>

          <Field label="Full delivery address" error={errors.address}>
            <textarea
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              rows={3}
              placeholder="House, road, area landmark…"
              className="input-field resize-none"
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-faint">Coupon code</span>
            {appliedCoupon ? (
              <div className="glass flex items-center justify-between rounded-xl px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-neon">
                  <Tag size={14} /> {appliedCoupon.code} applied
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null)
                    setCouponCode('')
                  }}
                  className="text-ink-faint hover:text-red-400"
                  aria-label="Remove coupon"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter code"
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="btn-ghost shrink-0 !px-4 text-sm"
                >
                  {applyingCoupon ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-faint">Payment method</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`glass-card flex items-start gap-3 p-4 text-left text-sm transition ${paymentMethod === 'cod' ? 'ring-2 ring-neon' : ''}`}
              >
                <span className="shrink-0 rounded-full bg-neon/10 px-2.5 py-1 text-xs font-bold text-neon">COD</span>
                <span className="text-ink-muted">Pay in cash when your order arrives.</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`glass-card flex items-start gap-3 p-4 text-left text-sm transition ${paymentMethod === 'online' ? 'ring-2 ring-neon' : ''}`}
              >
                <span className="shrink-0 rounded-full bg-neon/10 px-2.5 py-1 text-xs font-bold text-neon">Online</span>
                <span className="text-ink-muted">bKash, Nagad, Rocket, cards & internet banking.</span>
              </button>
            </div>
          </div>

          <button disabled={submitting} className="btn-primary w-full">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting
              ? paymentMethod === 'online' ? 'Redirecting to payment…' : 'Placing order…'
              : paymentMethod === 'online' ? `Pay online · ${formatBDT(grandTotal)}` : `Place order · ${formatBDT(grandTotal)}`}
          </button>
        </form>

        <div className="glass-card h-fit space-y-4 p-6">
          <h2 className="font-heading text-lg font-semibold">Order summary</h2>
          <ul className="space-y-3">
            {lineItems.map((i, idx) => (
              <li key={idx} className="flex gap-3">
                <img
                  src={mediaUrl(i.image)}
                  alt={i.title}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="line-clamp-2 text-sm">{i.title}</p>
                  <p className="text-xs text-ink-faint">Qty {i.quantity}{i.selectedColor ? ` · ${i.selectedColor}` : ''}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-neon">{formatBDT(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>{formatBDT(subtotal)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-neon">
                <span>Discount ({appliedCoupon.code})</span>
                <span>−{formatBDT(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-muted">
              <span>Shipping</span>
              <span>{selectedDistrict ? formatBDT(shipping) : 'Select district'}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 font-heading text-base font-bold text-ink">
              <span>Total</span>
              <span className="text-neon">{formatBDT(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  )
}
