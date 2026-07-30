import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag, ShieldCheck, Truck, RotateCcw, Star, ChevronDown } from 'lucide-react'
import { getProductBySlug, getProducts } from '../api/catalog'
import { mediaUrl } from '../api/client'
import { formatBDT, discountPercent } from '../lib/format'
import { useCart } from '../context/CartContext.jsx'
import CountdownTimer from '../components/ui/CountdownTimer.jsx'
import ProductCard from '../components/ui/ProductCard.jsx'
import ProductGridSkeleton from '../components/ui/ProductGridSkeleton.jsx'
import ShareButton from '../components/ui/ShareButton.jsx'

export default function ProductDetail() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [variant, setVariant] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [related, setRelated] = useState(null)
  const { addItem, toggleWishlist, isWishlisted } = useCart()

  useEffect(() => {
    setProduct(null)
    setNotFound(false)
    setActiveImage(0)
    setVariant('')
    setQuantity(1)
    window.scrollTo({ top: 0 })

    getProductBySlug(slug)
      .then((data) => {
        setProduct(data)
        rememberRecentlyViewed(data)
        if (data.category) {
          getProducts({ category: data.category })
            .then((r) => setRelated((r.results || []).filter((p) => p.slug !== slug).slice(0, 4)))
            .catch(() => setRelated([]))
        } else {
          setRelated([])
        }
      })
      .catch(() => setNotFound(true))
  }, [slug])

  if (notFound) {
    return (
      <div className="container-px mx-auto max-w-7xl py-24 text-center">
        <h1 className="font-heading text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-ink-muted">It may have sold out or been removed.</p>
        <Link to="/shop" className="btn-primary mt-6 inline-flex">Continue shopping</Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-px mx-auto max-w-7xl py-10">
        <ProductGridSkeleton count={1} />
      </div>
    )
  }

  const images = [
    { image: product.thumbnail },
    ...(product.images || []),
    ...(product.gallery || []),
  ].filter((i) => i.image)

  const discount = discountPercent(product.price, product.original_price)
  const wishlisted = isWishlisted(product.slug)
  const avgRating = product.reviews?.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null
  const shareUrl = `${window.location.origin}/product/${product.slug}`
  const shareImage = mediaUrl(images[0]?.image)

  return (
    <div className="container-px mx-auto max-w-7xl py-10">
      <Helmet>
        <title>{product.title} — Kino Mart</title>
        <meta name="description" content={product.short_description || product.title} />
        {/* Open Graph + Twitter Card — what makes a shared link show a proper
            title/image/price instead of a bare URL on Facebook, WhatsApp, X, etc. */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.title} />
        <meta property="og:description" content={product.short_description || product.title} />
        <meta property="og:url" content={shareUrl} />
        {shareImage && <meta property="og:image" content={shareImage} />}
        <meta property="product:price:amount" content={product.price} />
        <meta property="product:price:currency" content="BDT" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.title} />
        <meta name="twitter:description" content={product.short_description || product.title} />
        {shareImage && <meta name="twitter:image" content={shareImage} />}
      </Helmet>

      <div className="mb-6 flex items-center gap-1 text-xs text-ink-faint">
        <Link to="/" className="hover:text-neon">Home</Link> /
        <Link to="/shop" className="hover:text-neon">Shop</Link> /
        <span className="text-ink-muted line-clamp-1">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="glass-card mb-3 aspect-square overflow-hidden">
            <motion.img
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              src={mediaUrl(images[activeImage]?.image)}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-colors ${
                    activeImage === i ? 'border-neon' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={mediaUrl(img.image)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase panel */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-2 flex items-center gap-2">
            {product.section_type === 'hot' && (
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium">🔥 Hot</span>
            )}
            {product.section_type === 'trending' && (
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium">⚡ Trending</span>
            )}
            {product.model_number && (
              <span className="text-xs text-ink-faint">Model: {product.model_number}</span>
            )}
          </div>

          <h1 className="font-heading text-2xl font-bold leading-snug sm:text-3xl">{product.title}</h1>

          {avgRating && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(avgRating) ? 'fill-neon text-neon' : 'text-white/15'} />
                ))}
              </div>
              <span className="text-ink-muted">{avgRating} ({product.reviews.length} reviews)</span>
            </div>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-heading text-3xl font-extrabold text-neon">{formatBDT(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="price-strike text-lg">{formatBDT(product.original_price)}</span>
                <span className="rounded-full bg-neon px-2.5 py-1 text-xs font-bold text-black">-{discount}%</span>
              </>
            )}
          </div>

          {product.discount_timer && (
            <div className="mt-3">
              <CountdownTimer />
            </div>
          )}

          {product.short_description && (
            <p className="mt-5 text-sm leading-relaxed text-ink-muted">{product.short_description}</p>
          )}

          {product.variants?.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-faint">
                {product.variants[0].name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setVariant(v.value)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      variant === v.value ? 'border-neon bg-neon/10 text-neon' : 'border-white/15 text-ink-muted hover:border-neon/50'
                    }`}
                  >
                    {v.value}
                    {Number(v.price_modifier) > 0 && ` (+${formatBDT(v.price_modifier)})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="glass flex items-center gap-3 rounded-full px-3 py-2">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-1 text-ink-muted hover:text-neon">−</button>
              <span className="w-5 text-center">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="px-1 text-ink-muted hover:text-neon">+</button>
            </div>
            <span className={product.in_stock ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>
              {product.in_stock ? 'In stock' : 'Out of stock'}
            </span>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              disabled={!product.in_stock}
              onClick={() => addItem(product, { quantity, variant })}
              className="btn-primary flex-1"
            >
              <ShoppingBag size={16} /> Add to cart
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className={`btn-icon h-12 w-12 ${wishlisted ? 'border-neon text-neon' : ''}`}
              aria-label="Toggle wishlist"
            >
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
            <ShareButton
              title={product.title}
              text={`Check out ${product.title} on Kino Mart — ${formatBDT(product.price)}`}
              url={shareUrl}
            />
          </div>

          <Link
            to="/checkout"
            state={{ buyNow: { product, quantity, variant } }}
            className={`btn-ghost mt-3 w-full ${!product.in_stock ? 'pointer-events-none opacity-40' : ''}`}
          >
            Buy now
          </Link>

          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-white/10 pt-6 text-sm sm:grid-cols-3">
            <Trust icon={Truck} title="Delivery" text="24–72 hrs, nationwide COD" />
            <Trust icon={ShieldCheck} title="Genuine" text="100% authentic products" />
            <Trust icon={RotateCcw} title="Returns" text="7-day easy return" />
          </div>
        </div>
      </div>

      {/* Details tabs */}
      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {product.description_html && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-bold">Description</h2>
              <div
                className="prose prose-invert max-w-none text-sm text-ink-muted prose-headings:text-ink prose-strong:text-ink"
                dangerouslySetInnerHTML={{ __html: product.description_html }}
              />
            </section>
          )}

          {product.specifications?.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-bold">Specifications</h2>
              <div className="glass-card overflow-hidden">
                {product.specifications.map((s, i) => (
                  <div key={i} className={`flex justify-between px-5 py-3 text-sm ${i % 2 ? 'bg-white/[0.02]' : ''}`}>
                    <span className="text-ink-faint">{s.label}</span>
                    <span className="font-medium text-ink">{s.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {product.faqs?.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-bold">Questions & Answers</h2>
              <div className="space-y-2">
                {product.faqs.map((f, i) => (
                  <FaqItem key={i} q={f.question} a={f.answer} />
                ))}
              </div>
            </section>
          )}

          {product.reviews?.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-bold">Customer reviews</h2>
              <div className="space-y-4">
                {product.reviews.map((r, i) => (
                  <div key={i} className="glass-card p-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{r.reviewer_name}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} size={13} className={idx < r.rating ? 'fill-neon text-neon' : 'text-white/15'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-ink-muted">{r.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-heading text-xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Trust({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={17} className="mt-0.5 shrink-0 text-neon" />
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-faint">{text}</p>
      </div>
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-card overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium">
        {q}
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180 text-neon' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-5 text-sm text-ink-muted"
          >
            <p className="pb-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function rememberRecentlyViewed(product) {
  try {
    const key = 'kinomart_recently_viewed'
    const list = JSON.parse(localStorage.getItem(key) || '[]').filter((p) => p.slug !== product.slug)
    list.unshift({ slug: product.slug, title: product.title, price: product.price, thumbnail: product.thumbnail })
    localStorage.setItem(key, JSON.stringify(list.slice(0, 12)))
  } catch {
    /* localStorage unavailable — recently viewed is a non-critical enhancement */
  }
}
