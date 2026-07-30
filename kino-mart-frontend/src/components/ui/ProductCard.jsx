import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Eye } from 'lucide-react'
import { mediaUrl } from '../../api/client'
import { formatBDT, discountPercent } from '../../lib/format'
import { useCart } from '../../context/CartContext.jsx'

export default function ProductCard({ product, index = 0 }) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const { addItem, toggleWishlist, isWishlisted } = useCart()
  const discount = discountPercent(product.price, product.original_price)
  const wishlisted = isWishlisted(product.slug)

  function onMouseMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -6, y: px * 8 })
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: Math.min(index, 6) * 0.05 }}
      className="group relative"
      style={{ perspective: 900 }}
    >
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: 'preserve-3d' }}
        className="glass-card relative flex h-full flex-col overflow-hidden transition-shadow duration-300 will-change-transform hover:shadow-neon"
      >
        {/* badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-neon px-2.5 py-1 text-[11px] font-bold text-black">-{discount}%</span>
          )}
          {product.section_type === 'hot' && (
            <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur">
              🔥 Hot
            </span>
          )}
          {product.section_type === 'trending' && (
            <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur">
              ⚡ Trending
            </span>
          )}
        </div>

        <button
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur transition-colors ${
            wishlisted ? 'border-neon bg-neon/10 text-neon' : 'border-white/15 bg-black/50 text-ink hover:text-neon'
          }`}
        >
          <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        <Link to={`/product/${product.slug}`} className="block overflow-hidden">
          <div className="aspect-square overflow-hidden bg-white/5">
            <img
              src={mediaUrl(product.thumbnail)}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
        </Link>

        <div className="flex flex-1 flex-col gap-2 p-4" style={{ transform: 'translateZ(30px)' }}>
          <Link to={`/product/${product.slug}`}>
            <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-medium text-ink transition-colors group-hover:text-neon">
              {product.title}
            </h3>
          </Link>
          <div className="mt-auto flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-base font-bold text-neon">{formatBDT(product.price)}</span>
              {discount > 0 && <span className="price-strike text-xs">{formatBDT(product.original_price)}</span>}
            </div>
            {!product.in_stock && <span className="text-[11px] font-medium text-red-400">Out of stock</span>}
          </div>

          <div className="mt-2 flex gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              disabled={!product.in_stock}
              onClick={() => addItem(product)}
              className="btn-primary flex-1 !px-3 !py-2 text-xs"
            >
              <ShoppingBag size={13} /> Add
            </button>
            <Link to={`/product/${product.slug}`} className="btn-ghost !px-3 !py-2 text-xs" aria-label="Quick view">
              <Eye size={13} />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
