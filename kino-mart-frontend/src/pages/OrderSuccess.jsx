import { useLocation, Link, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { CheckCircle2, Truck, Phone } from 'lucide-react'
import { formatBDT } from '../lib/format'
import { mediaUrl } from '../api/client'

export default function OrderSuccess() {
  const location = useLocation()
  const order = location.state?.order

  if (!order) return <Navigate to="/" replace />

  return (
    <div className="container-px mx-auto max-w-2xl py-16 sm:py-24">
      <Helmet><title>Order confirmed — Kino Mart</title></Helmet>

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
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neon/10"
        >
          <CheckCircle2 size={32} className="text-neon" />
        </motion.div>

        <h1 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">Order placed!</h1>
        <p className="mt-2 text-ink-muted">
          Thanks{order.full_name ? `, ${order.full_name.split(' ')[0]}` : ''} —{' '}
          {order.id ? (
            <>order <span className="font-semibold text-ink">#{order.id}</span> is confirmed.</>
          ) : (
            'your order is confirmed.'
          )}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
          <div className="glass-card flex items-start gap-2.5 p-4">
            <Truck size={17} className="mt-0.5 shrink-0 text-neon" />
            <div>
              <p className="text-sm font-medium">Delivery in 24–72 hrs</p>
              <p className="text-xs text-ink-faint">{order.district} · Cash on delivery</p>
            </div>
          </div>
          <div className="glass-card flex items-start gap-2.5 p-4">
            <Phone size={17} className="mt-0.5 shrink-0 text-neon" />
            <div>
              <p className="text-sm font-medium">We'll call to confirm</p>
              <p className="text-xs text-ink-faint">{order.phone_number}</p>
            </div>
          </div>
        </div>

        {order.items?.length > 0 && (
          <ul className="mt-8 space-y-3 text-left">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0">
                {i.image && (
                  <img src={mediaUrl(i.image)} alt={i.title} className="h-12 w-12 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="line-clamp-1 text-sm">{i.title}</p>
                  <p className="text-xs text-ink-faint">Qty {i.quantity}</p>
                </div>
                <span className="text-sm font-medium text-neon">{formatBDT(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex justify-between border-t border-white/10 pt-5 font-heading text-lg font-bold">
          <span>Total</span>
          <span className="text-neon">{formatBDT(order.grand_total)}</span>
        </div>

        <Link to="/shop" className="btn-primary mt-8 w-full">
          Continue shopping
        </Link>
      </motion.div>
    </div>
  )
}
