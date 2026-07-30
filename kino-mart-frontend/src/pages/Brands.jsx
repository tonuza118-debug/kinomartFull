import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { getBrands } from '../api/catalog'
import { mediaUrl } from '../api/client'
import ProductGridSkeleton from '../components/ui/ProductGridSkeleton.jsx'

export default function Brands() {
  const [brands, setBrands] = useState(null)

  useEffect(() => {
    getBrands()
      .then(setBrands)
      .catch(() => setBrands([]))
  }, [])

  return (
    <div className="container-px mx-auto max-w-7xl py-12">
      <Helmet><title>Brands — Kino Mart</title></Helmet>
      <h1 className="mb-2 font-heading text-2xl font-bold sm:text-3xl">Shop by brand</h1>
      <p className="mb-8 text-sm text-ink-muted">Browse products from every brand we carry.</p>

      {brands === null ? (
        <ProductGridSkeleton count={10} />
      ) : brands.length === 0 ? (
        <div className="glass-card py-16 text-center text-ink-muted">No brands listed yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {brands.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Link
                to={`/shop?brand=${b.id}`}
                className="glass-card flex aspect-square flex-col items-center justify-center gap-3 p-6 text-center transition-transform duration-300 hover:-translate-y-1 hover:shadow-neon"
              >
                <img src={mediaUrl(b.logo)} alt={b.name} className="h-14 w-14 object-contain" loading="lazy" />
                <span className="text-sm font-medium text-ink-muted">{b.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
