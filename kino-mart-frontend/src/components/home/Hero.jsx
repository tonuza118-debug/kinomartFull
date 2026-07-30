import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, ShieldCheck, Truck, Zap } from 'lucide-react'
import { getBanners } from '../../api/storefront'
import { mediaUrl } from '../../api/client'

export default function Hero() {
  const ref = useRef(null)
  const [banner, setBanner] = useState(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 })
  const glowX = useTransform(mx, [-0.5, 0.5], ['20%', '80%'])
  const glowY = useTransform(my, [-0.5, 0.5], ['20%', '80%'])

  useEffect(() => {
    getBanners('hero')
      .then((list) => setBanner(list[0] || null))
      .catch(() => setBanner(null))
  }, [])

  function onMouseMove(e) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      className="relative isolate overflow-hidden border-b border-white/10"
      style={{ perspective: 1200 }}
    >
      {/* ambient gradient glow that follows the cursor */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: useTransform(
            [glowX, glowY],
            ([x, y]) => `radial-gradient(45rem 30rem at ${x} ${y}, rgba(233,255,0,0.14), transparent 60%)`,
          ),
        }}
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),transparent_55%)]" />

      <div className="container-px mx-auto grid max-w-7xl items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:py-32">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="section-eyebrow mb-5"
          >
            {banner?.subtitle || 'New season, sharper tech'}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl"
          >
            {banner?.title || (
              <>
                Precision gear for a<span className="text-neon"> sharper</span> everyday.
              </>
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-md text-base text-ink-muted"
          >
            Kino Mart curates premium electronics, wellness gear and everyday essentials —
            engineered looks, honest prices, cash on delivery anywhere in Bangladesh.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to={banner?.link || '/shop'} className="btn-primary">
              Shop the collection <ArrowRight size={16} />
            </Link>
            <Link to="/shop?section=hot" className="btn-ghost">
              🔥 Hot deals
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-xs text-ink-muted sm:text-sm"
          >
            <Feature icon={Truck} text="Nationwide COD" />
            <Feature icon={ShieldCheck} text="Genuine products" />
            <Feature icon={Zap} text="Fast dispatch" />
          </motion.div>
        </div>

        {/* Floating glass "product stage" — logo-inspired geometric mark instead of a heavy 3D library */}
        <motion.div
          style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-neon/10 blur-3xl" />
          {banner?.image ? (
            <div
              style={{ transform: 'translateZ(40px)' }}
              className="glass-card relative h-full w-full overflow-hidden"
            >
              <img src={mediaUrl(banner.image)} alt={banner.title || 'Featured'} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div style={{ transform: 'translateZ(40px)' }} className="glass-card relative flex h-full w-full items-center justify-center overflow-hidden">
              <motion.div
                className="flex flex-col items-center gap-4"
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="140" height="140" viewBox="0 0 64 64" fill="none">
                  <rect width="64" height="64" rx="16" fill="#0B0B0B" />
                  <path d="M18 12h9v16.5L39 12h11L34 30l17 22H40L27 34.5V44h-9z" fill="#E9FF00" />
                </svg>
                <span className="font-display text-sm uppercase tracking-[0.4em] text-ink-faint">
                  Kino Mart
                </span>
              </motion.div>
            </div>
          )}
          {/* floating accent chips */}
          <motion.div
            style={{ transform: 'translateZ(70px)' }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="glass-card absolute -left-6 top-8 hidden px-4 py-2.5 sm:block"
          >
            <p className="text-xs text-ink-muted">Delivered in</p>
            <p className="font-heading text-sm font-bold text-neon">24–72 hrs</p>
          </motion.div>
          <motion.div
            style={{ transform: 'translateZ(70px)' }}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="glass-card absolute -right-4 bottom-10 hidden px-4 py-2.5 sm:block"
          >
            <p className="text-xs text-ink-muted">Cash on</p>
            <p className="font-heading text-sm font-bold text-neon">Delivery</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function Feature({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-neon" />
      <span>{text}</span>
    </div>
  )
}
