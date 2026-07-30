import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { trackOrder } from '../api/storefront'
import { initiatePayment } from '../api/payments'
import { formatBDT } from '../lib/format'
import { mediaUrl } from '../api/client'

const COPY = {
  success: { icon: CheckCircle2, iconClass: 'text-neon bg-neon/10', title: 'Payment received!' },
  failed: { icon: XCircle, iconClass: 'text-red-400 bg-red-400/10', title: 'Payment failed' },
  cancelled: { icon: XCircle, iconClass: 'text-red-400 bg-red-400/10', title: 'Payment cancelled' },
}

export default function PaymentResult() {
  const [params] = useSearchParams()
  const status = params.get('status') || 'failed'
  const orderId = params.get('order_id')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    let pending
    try {
      pending = JSON.parse(sessionStorage.getItem('kinomart_pending_order') || 'null')
    } catch {
      pending = null
    }

    if (!pending?.phone) {
      setLoading(false)
      return
    }

    trackOrder(pending.phone)
      .then((orders) => {
        const match = orders.find((o) => String(o.id) === String(orderId))
        setOrder(match || null)
      })
      .catch(() => setOrder(null))
      .finally(() => {
        setLoading(false)
        if (status === 'success') sessionStorage.removeItem('kinomart_pending_order')
      })
  }, [orderId, status])

  async function retryPayment() {
    let pending
    try {
      pending = JSON.parse(sessionStorage.getItem('kinomart_pending_order') || 'null')
    } catch {
      pending = null
    }
    if (!pending?.phone || !pending?.orderId) {
      toast.error('Could not find your order to retry. Please use Track My Order instead.')
      return
    }
    setRetrying(true)
    try {
      const { payment_url } = await initiatePayment(pending.orderId, pending.phone)
      window.location.href = payment_url
    } catch (err) {
      toast.error(err.message || 'Could not start payment. Please try again.')
      setRetrying(false)
    }
  }

  const copy = COPY[status] || COPY.failed
  const Icon = copy.icon

  return (
    <div className="container-px mx-auto max-w-2xl py-16 sm:py-24">
      <Helmet><title>{copy.title} — Kino Mart</title></Helmet>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 text-center sm:p-12"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${copy.iconClass}`}
        >
          <Icon size={32} />
        </motion.div>

        <h1 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">{copy.title}</h1>
        <p className="mt-2 text-ink-muted">
          {orderId ? <>Order <span className="font-semibold text-ink">#{orderId}</span></> : 'Your order'}
          {status === 'success' && ' is confirmed and marked as paid.'}
          {status === 'failed' && ' — the payment did not go through. No money was taken.'}
          {status === 'cancelled' && ' — you cancelled before completing payment.'}
        </p>

        {loading && (
          <div className="mt-8 flex justify-center text-ink-faint">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}

        {!loading && order && (
          <>
            <ul className="mt-8 space-y-3 text-left">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0">
                  {i.image && <img src={mediaUrl(i.image)} alt={i.title} className="h-12 w-12 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm">{i.title}</p>
                    <p className="text-xs text-ink-faint">Qty {i.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-neon">{formatBDT(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex justify-between border-t border-white/10 pt-5 font-heading text-lg font-bold">
              <span>Total</span>
              <span className="text-neon">{formatBDT(order.grand_total)}</span>
            </div>
          </>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {status !== 'success' && (
            <button onClick={retryPayment} disabled={retrying} className="btn-primary flex-1">
              {retrying ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Retry payment'}
            </button>
          )}
          <Link to="/shop" className={`btn-primary flex-1 ${status !== 'success' ? '!bg-transparent !text-ink ring-1 ring-white/15' : ''}`}>
            Continue shopping
          </Link>
        </div>
        {status !== 'success' && (
          <p className="mt-4 text-xs text-ink-faint">
            Or check <Link to="/track-order" className="underline">Track My Order</Link> anytime with your phone number.
          </p>
        )}
      </motion.div>
    </div>
  )
}
