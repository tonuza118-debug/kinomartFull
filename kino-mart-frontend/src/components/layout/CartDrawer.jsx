import { AnimatePresence, motion } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { formatBDT } from '../../lib/format'
import { mediaUrl } from '../../api/client'

export default function CartDrawer() {
  const { items, isCartOpen, setCartOpen, updateQuantity, removeItem, subtotal } = useCart()

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0d0d0d] shadow-glass"
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h2 className="font-heading text-lg font-semibold">Your Cart ({items.length})</h2>
              <button onClick={() => setCartOpen(false)} className="btn-icon" aria-label="Close cart">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <ShoppingBag size={40} className="text-ink-faint" />
                  <p className="text-ink-muted">Your cart is empty.</p>
                  <Link to="/shop" onClick={() => setCartOpen(false)} className="btn-primary mt-2">
                    Start shopping
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={`${item.slug}-${item.selectedColor}`} className="glass-card flex gap-3 p-3">
                      <img
                        src={mediaUrl(item.image)}
                        alt={item.title}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                        loading="lazy"
                      />
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <p className="line-clamp-2 text-sm font-medium text-ink">{item.title}</p>
                          {item.selectedColor && (
                            <p className="mt-0.5 text-xs text-ink-faint">{item.selectedColor}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full border border-white/10 px-1">
                            <button
                              className="p-1.5 text-ink-muted hover:text-neon"
                              onClick={() => updateQuantity(item.slug, item.selectedColor, item.quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-4 text-center text-sm">{item.quantity}</span>
                            <button
                              className="p-1.5 text-ink-muted hover:text-neon"
                              onClick={() => updateQuantity(item.slug, item.selectedColor, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="font-heading text-sm font-semibold text-neon">
                            {formatBDT(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.slug, item.selectedColor)}
                        className="self-start p-1 text-ink-faint hover:text-red-400"
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-white/10 px-6 py-5">
                <div className="mb-4 flex items-center justify-between text-sm text-ink-muted">
                  <span>Subtotal</span>
                  <span className="font-heading text-lg font-bold text-ink">{formatBDT(subtotal)}</span>
                </div>
                <p className="mb-4 text-xs text-ink-faint">Shipping is calculated at checkout by district.</p>
                <Link
                  to="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="btn-primary w-full"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
