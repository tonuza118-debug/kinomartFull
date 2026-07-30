import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getBanners } from '../../api/storefront'
import { mediaUrl } from '../../api/client'

export default function PromoBanners() {
  const [banners, setBanners] = useState([])

  useEffect(() => {
    Promise.all([getBanners('offer'), getBanners('promo'), getBanners('special')])
      .then(([a, b, c]) => setBanners([...a, ...b, ...c].slice(0, 3)))
      .catch(() => setBanners([]))
  }, [])

  if (banners.length === 0) return null

  return (
    <section className="container-px mx-auto max-w-7xl py-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Link
              to={b.link || '/shop'}
              className="glass-card group relative block h-48 overflow-hidden"
            >
              <img
                src={mediaUrl(b.image)}
                alt={b.title || 'Promotion'}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                {b.title && <p className="font-heading text-lg font-bold text-ink">{b.title}</p>}
                {b.subtitle && <p className="text-sm text-ink-muted">{b.subtitle}</p>}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
