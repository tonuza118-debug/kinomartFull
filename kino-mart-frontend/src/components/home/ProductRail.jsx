import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getProducts } from '../../api/catalog'
import ProductCard from '../ui/ProductCard.jsx'
import ProductGridSkeleton from '../ui/ProductGridSkeleton.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'

export default function ProductRail({ eyebrow, title, subtitle, params, viewAllTo }) {
  const [products, setProducts] = useState(null)
  const scrollerRef = useRef(null)

  useEffect(() => {
    let alive = true
    getProducts(params)
      .then((data) => alive && setProducts(data.results || []))
      .catch(() => alive && setProducts([]))
    return () => {
      alive = false
    }
  }, [JSON.stringify(params)])

  function scrollBy(dir) {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  if (products && products.length === 0) return null

  return (
    <section className="container-px mx-auto max-w-7xl py-12">
      <div className="flex items-end justify-between">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} viewAllTo={viewAllTo} />
        <div className="mb-8 hidden gap-2 sm:flex">
          <button onClick={() => scrollBy(-1)} className="btn-icon" aria-label="Scroll left">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollBy(1)} className="btn-icon" aria-label="Scroll right">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!products ? (
        <ProductGridSkeleton count={4} />
      ) : (
        <div ref={scrollerRef} className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 scrollbar-none">
          {products.map((p, i) => (
            <div key={p.id} className="w-[220px] shrink-0 snap-start sm:w-[250px]">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
