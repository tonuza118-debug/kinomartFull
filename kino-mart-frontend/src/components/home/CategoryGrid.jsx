import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCategories } from '../../api/catalog'
import { mediaUrl } from '../../api/client'
import SectionHeading from '../ui/SectionHeading.jsx'

export default function CategoryGrid() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  if (categories.length === 0) return null

  return (
    <section className="container-px mx-auto max-w-7xl py-16">
      <SectionHeading eyebrow="Browse" title="Shop by category" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {categories.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
          >
            <Link
              to={`/shop?category=${c.id}`}
              className="group glass-card flex flex-col items-center gap-3 p-4 text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-neon"
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/5">
                {c.image ? (
                  <img src={mediaUrl(c.image)} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="font-heading text-lg font-bold text-neon">{c.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-xs font-medium text-ink-muted transition-colors group-hover:text-neon">
                {c.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
