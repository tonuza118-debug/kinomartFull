import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { getProducts, getProductBySlug } from '../../api/catalog'
import SectionHeading from '../ui/SectionHeading.jsx'

export default function Testimonials() {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { results } = await getProducts({ section_type: 'hot' })
        const details = await Promise.all(results.slice(0, 4).map((p) => getProductBySlug(p.slug)))
        const collected = details
          .flatMap((d) => (d.reviews || []).map((r) => ({ ...r, product: d.title })))
          .slice(0, 6)
        if (alive) setReviews(collected)
      } catch {
        if (alive) setReviews([])
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (reviews.length === 0) return null

  return (
    <section className="container-px mx-auto max-w-7xl py-16">
      <SectionHeading eyebrow="Real feedback" title="What customers are saying" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <motion.blockquote
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="glass-card flex h-full flex-col gap-3 p-6"
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  size={14}
                  className={idx < r.rating ? 'fill-neon text-neon' : 'text-white/15'}
                />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">"{r.comment}"</p>
            <footer className="mt-auto text-xs text-ink-faint">
              <span className="font-medium text-ink">{r.reviewer_name}</span> · {r.product}
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  )
}
