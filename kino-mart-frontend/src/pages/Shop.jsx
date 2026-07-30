import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SlidersHorizontal, X } from 'lucide-react'
import { getCategories, getProducts } from '../api/catalog'
import ProductCard from '../components/ui/ProductCard.jsx'
import ProductGridSkeleton from '../components/ui/ProductGridSkeleton.jsx'

const PAGE_SIZE = 20

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [count, setCount] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const category = searchParams.get('category') || ''
  const brand = searchParams.get('brand') || ''
  const section = searchParams.get('section') || ''
  // Backwards-compatible: some links out there (Navbar, older bookmarks) may still use `q`.
  const search = searchParams.get('search') || searchParams.get('q') || ''
  const ordering = searchParams.get('ordering') || ''
  const page = Number(searchParams.get('page') || 1)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)

    getProducts({
      page,
      category: category || undefined,
      brand: brand || undefined,
      section_type: section || undefined,
      search: search || undefined,
      ordering: ordering || undefined,
    })
      .then((data) => {
        if (!alive) return
        setProducts(data.results || [])
        setCount(data.count ?? (data.results || []).length)
      })
      .catch(() => alive && setProducts([]))
      .finally(() => alive && setLoading(false))

    return () => {
      alive = false
    }
  }, [category, brand, section, search, ordering, page])

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const activeCategory = categories.find((c) => String(c.id) === category)

  return (
    <div className="container-px mx-auto max-w-7xl py-10">
      <Helmet>
        <title>{activeCategory ? `${activeCategory.name} — Kino Mart` : 'Shop all — Kino Mart'}</title>
      </Helmet>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">
            {search ? `Results for "${search}"` : activeCategory ? activeCategory.name : 'All products'}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{loading ? 'Loading…' : `${count} product${count === 1 ? '' : 's'}`}</p>
        </div>
        <button onClick={() => setFiltersOpen(true)} className="btn-ghost text-sm lg:hidden">
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <FilterPanel
            categories={categories}
            category={category}
            section={section}
            onCategory={(v) => updateParam('category', v)}
            onSection={(v) => updateParam('section', v)}
          />
        </aside>

        {filtersOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 p-4 lg:hidden" onClick={() => setFiltersOpen(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-card mx-auto mt-16 max-w-sm p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading font-semibold">Filters</h3>
                <button onClick={() => setFiltersOpen(false)} className="btn-icon" aria-label="Close filters">
                  <X size={15} />
                </button>
              </div>
              <FilterPanel
                categories={categories}
                category={category}
                section={section}
                onCategory={(v) => {
                  updateParam('category', v)
                  setFiltersOpen(false)
                }}
                onSection={(v) => {
                  updateParam('section', v)
                  setFiltersOpen(false)
                }}
              />
            </div>
          </div>
        )}

        <div>
          <div className="mb-5 flex justify-end">
            <select
              value={ordering}
              onChange={(e) => updateParam('ordering', e.target.value)}
              className="glass rounded-full px-4 py-2 text-sm text-ink focus:outline-none"
              aria-label="Sort products"
            >
              <option value="" className="bg-base">Sort: Featured</option>
              <option value="price" className="bg-base">Price: Low to high</option>
              <option value="-price" className="bg-base">Price: High to low</option>
              <option value="-created_at" className="bg-base">Newest first</option>
            </select>
          </div>

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <div className="glass-card flex flex-col items-center gap-2 py-20 text-center">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm text-ink-muted">Try a different category or clear your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.set('page', String(i + 1))
                    setSearchParams(next)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={`h-9 w-9 rounded-full text-sm transition-colors ${
                    page === i + 1 ? 'bg-neon font-bold text-black' : 'glass text-ink-muted hover:text-neon'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterPanel({ categories, category, section, onCategory, onSection }) {
  return (
    <div className="space-y-8">
      <div>
        <h4 className="section-eyebrow mb-3">Category</h4>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => onCategory('')}
              className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                !category ? 'bg-white/5 text-neon' : 'text-ink-muted hover:text-neon'
              }`}
            >
              All categories
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onCategory(String(c.id))}
                className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                  category === String(c.id) ? 'bg-white/5 text-neon' : 'text-ink-muted hover:text-neon'
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="section-eyebrow mb-3">Collection</h4>
        <ul className="space-y-1 text-sm">
          {[
            { label: 'All', value: '' },
            { label: '🔥 Hot deals', value: 'hot' },
            { label: '⚡ Trending', value: 'trending' },
            { label: 'Everyday', value: 'normal' },
          ].map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => onSection(opt.value)}
                className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                  section === opt.value ? 'bg-white/5 text-neon' : 'text-ink-muted hover:text-neon'
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
