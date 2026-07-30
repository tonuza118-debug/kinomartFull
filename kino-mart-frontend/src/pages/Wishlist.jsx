import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { formatBDT } from '../lib/format'
import { mediaUrl } from '../api/client'

export default function Wishlist() {
  const { wishlist, toggleWishlist, addItem } = useCart()

  return (
    <div className="container-px mx-auto max-w-6xl py-12">
      <Helmet><title>Wishlist — Kino Mart</title></Helmet>
      <h1 className="mb-8 font-heading text-2xl font-bold sm:text-3xl">Your wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="glass-card flex flex-col items-center gap-3 py-20 text-center">
          <Heart size={36} className="text-ink-faint" />
          <p className="text-ink-muted">Nothing saved yet.</p>
          <Link to="/shop" className="btn-primary mt-2">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((p) => (
            <div key={p.slug} className="glass-card flex gap-4 p-4">
              <Link to={`/product/${p.slug}`} className="shrink-0">
                <img src={mediaUrl(p.thumbnail)} alt={p.title} className="h-20 w-20 rounded-xl object-cover" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link to={`/product/${p.slug}`} className="line-clamp-2 text-sm font-medium hover:text-neon">
                    {p.title}
                  </Link>
                  <p className="mt-1 font-heading text-sm font-bold text-neon">{formatBDT(p.price)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => addItem(p)} className="btn-primary !px-3 !py-1.5 text-xs">
                    <ShoppingBag size={12} /> Add
                  </button>
                  <button onClick={() => toggleWishlist(p)} className="btn-icon h-8 w-8" aria-label="Remove">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
