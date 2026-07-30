import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Package, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyOrders } from '../api/storefront'
import { formatBDT } from '../lib/format'

export default function Account() {
  const { user, loading, logout } = useAuth()
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    if (user) {
      getMyOrders()
        .then(setOrders)
        .catch(() => setOrders([]))
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-ink-faint" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: '/account' }} replace />

  return (
    <div className="container-px mx-auto max-w-4xl py-12">
      <Helmet><title>My account — Kino Mart</title></Helmet>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            Hi, {user.first_name || user.username}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
        </div>
        <button onClick={logout} className="btn-ghost text-sm">
          <LogOut size={14} /> Sign out
        </button>
      </div>

      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold">Order history</h2>
        {orders === null ? (
          <div className="glass-card animate-pulse p-8 text-sm text-ink-faint">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-3 py-16 text-center">
            <Package size={32} className="text-ink-faint" />
            <p className="text-ink-muted">No orders yet.</p>
            <Link to="/shop" className="btn-primary mt-1">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="glass-card p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">Order #{o.id}</p>
                    <p className="text-xs text-ink-faint">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium capitalize">
                    {o.status}
                  </span>
                </div>
                <ul className="space-y-1.5 text-sm text-ink-muted">
                  {o.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="line-clamp-1">{it.title} × {it.quantity}</span>
                      <span>{formatBDT(it.price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-sm font-semibold">
                  <span>Total</span>
                  <span className="text-neon">{formatBDT(o.grand_total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
