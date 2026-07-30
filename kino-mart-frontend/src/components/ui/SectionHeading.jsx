import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

export default function SectionHeading({ eyebrow, title, subtitle, viewAllTo }) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {eyebrow && <p className="section-eyebrow mb-2">{eyebrow}</p>}
        <h2 className="font-heading text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-ink-muted">{subtitle}</p>}
      </motion.div>
      {viewAllTo && (
        <Link to={viewAllTo} className="btn-ghost shrink-0 text-sm">
          View all <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  )
}
