import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, User } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getCategories } from '../../api/catalog'
import Logo from '../ui/Logo.jsx'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { itemCount, wishlist, setCartOpen } = useCart()
  const { isAuthenticated, user } = useAuth()
  const closeTimer = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  function submitSearch(e) {
    e.preventDefault()
    navigate(query.trim() ? `/shop?search=${encodeURIComponent(query.trim())}` : '/shop')
    setMobileOpen(false)
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-glass' : 'bg-transparent'
      }`}
    >
      <div className="container-px mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 py-3">
        <Link to="/" className="shrink-0" aria-label="Kino Mart home">
          <Logo />
        </Link>

        {/* Categories mega menu trigger (desktop) */}
        <div
          className="relative hidden lg:block"
          onMouseEnter={() => {
            clearTimeout(closeTimer.current)
            setMegaOpen(true)
          }}
          onMouseLeave={() => {
            closeTimer.current = setTimeout(() => setMegaOpen(false), 150)
          }}
        >
          <button className="flex items-center gap-1 text-sm font-medium text-ink/90 hover:text-neon transition-colors">
            Categories <ChevronDown size={15} className={`transition-transform ${megaOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {megaOpen && categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="glass-card absolute left-1/2 top-full mt-3 w-[560px] -translate-x-1/2 p-5"
              >
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/shop?category=${c.id}`}
                      className="rounded-xl px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-neon"
                      onClick={() => setMegaOpen(false)}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search */}
        <form onSubmit={submitSearch} className="hidden max-w-md flex-1 md:block">
          <div className="glass flex items-center gap-2 rounded-full px-4 py-2.5 transition-colors focus-within:border-neon/50">
            <Search size={16} className="text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search products, brands…"
              aria-label="Search products"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            className="btn-icon hidden sm:inline-flex"
            aria-label={isAuthenticated ? 'My account' : 'Sign in'}
            title={isAuthenticated ? (user?.first_name || user?.username) : 'Sign in'}
          >
            <User size={18} />
          </Link>
          <Link to="/wishlist" className="btn-icon relative hidden sm:inline-flex" aria-label="Wishlist">
            <Heart size={18} />
            {wishlist.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon text-[10px] font-bold text-black">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button onClick={() => setCartOpen(true)} className="btn-icon relative" aria-label="Open cart">
            <ShoppingBag size={18} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon text-[10px] font-bold text-black">
                {itemCount}
              </span>
            )}
          </button>
          <button
            className="btn-icon lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-black/90 backdrop-blur-xl lg:hidden"
          >
            <div className="container-px mx-auto flex flex-col gap-4 py-5">
              <form onSubmit={submitSearch} className="glass flex items-center gap-2 rounded-full px-4 py-2.5">
                <Search size={16} className="text-ink-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Search products…"
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </form>
              <div className="flex flex-col gap-1">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/shop?category=${c.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-2 py-2.5 text-sm text-ink-muted hover:bg-white/5 hover:text-neon"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
              <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-2 text-sm text-ink-muted">
                <Heart size={16} /> Wishlist ({wishlist.length})
              </Link>
              <Link
                to={isAuthenticated ? '/account' : '/login'}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-2 text-sm text-ink-muted"
              >
                <User size={16} /> {isAuthenticated ? 'My account' : 'Sign in'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
