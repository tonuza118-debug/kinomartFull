import { useState } from 'react'
import StaticPage from './StaticPage.jsx'
import toast from 'react-hot-toast'
import { trackOrder } from '../api/storefront'
import { formatBDT } from '../lib/format'

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function TrackOrder() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error('Enter the phone number you used at checkout.')
      return
    }
    setLoading(true)
    setOrders(null)
    try {
      const data = await trackOrder(phone.trim())
      setOrders(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <StaticPage title="Track my order">
      <p>Enter the phone number you used at checkout to see your order status.</p>
      <form onSubmit={submit} className="mt-4 flex max-w-sm gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          className="input-field"
        />
        <button className="btn-primary shrink-0" disabled={loading}>
          {loading ? 'Checking…' : 'Track'}
        </button>
      </form>

      {orders && (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="max-w-xl rounded-lg border border-ink-faint/20 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">Order #{order.id}</h2>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                  {STATUS_LABEL[order.status] || order.status}
                </span>
              </div>
              <p className="mt-2 text-sm">{order.full_name} · {order.district}</p>
              <p className="text-sm">{order.address}</p>
              <p className="mt-1 text-xs text-ink-faint">Placed {new Date(order.created_at).toLocaleString()}</p>

              <ul className="mt-4 space-y-2 border-t border-ink-faint/10 pt-4">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span>
                      {item.title}
                      {item.selected_color ? ` (${item.selected_color})` : ''} × {item.quantity}
                    </span>
                    <span>{formatBDT(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-1 border-t border-ink-faint/10 pt-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatBDT(order.subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{formatBDT(order.shipping_charge)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span>{formatBDT(order.grand_total)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </StaticPage>
  )
}
