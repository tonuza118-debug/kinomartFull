import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext.jsx'
import * as store from '../api/storefront'

const CartContext = createContext(null)
const STORAGE_KEY = 'kinomart_cart_v1'
const WISHLIST_KEY = 'kinomart_wishlist_v1'

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// Cart line identity = slug + variant combo, so the same product with a
// different color/size option is tracked as its own line.
function lineKey(slug, variant) {
  return variant ? `${slug}::${variant}` : slug
}

function mapServerCart(data) {
  return (data?.items || []).map((i) => ({
    slug: i.product_detail.slug,
    title: i.product_detail.title,
    price: Number(i.product_detail.price),
    image: i.product_detail.thumbnail || '',
    selectedColor: i.variant_value || '',
    quantity: i.quantity,
  }))
}

function mapServerWishlist(data) {
  return (data?.products || []).map((p) => ({
    slug: p.slug,
    title: p.title,
    price: Number(p.price),
    thumbnail: p.thumbnail || '',
  }))
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState(() => readStorage(STORAGE_KEY, []))
  const [wishlist, setWishlist] = useState(() => readStorage(WISHLIST_KEY, []))
  const [isCartOpen, setCartOpen] = useState(false)
  const hasMergedRef = useRef(false)

  // Guests: persist to localStorage. Logged-in users: state mirrors the server,
  // so there's nothing to persist locally (and we don't want to resurrect a
  // stale guest cart after logout).
  useEffect(() => {
    if (!isAuthenticated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
  }, [wishlist, isAuthenticated])

  // On login: push any guest-session cart/wishlist items up to the account,
  // then load the merged server state and stop using localStorage for these.
  useEffect(() => {
    if (!isAuthenticated) {
      hasMergedRef.current = false
      return
    }
    if (hasMergedRef.current) return
    hasMergedRef.current = true

    ;(async () => {
      try {
        const guestCart = readStorage(STORAGE_KEY, [])
        const guestWishlist = readStorage(WISHLIST_KEY, [])

        await Promise.all(guestCart.map((i) => store.addToServerCart(i.slug, i.quantity, i.selectedColor || '')))
        await Promise.all(guestWishlist.map((p) => store.addToWishlist(p.slug)))

        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(WISHLIST_KEY)

        const [cart, wl] = await Promise.all([store.getServerCart(), store.getWishlist()])
        setItems(mapServerCart(cart))
        setWishlist(mapServerWishlist(wl))
      } catch {
        // Non-fatal — the account's server-side cart/wishlist (if any) simply
        // won't include the merged guest items this time.
      }
    })()
  }, [isAuthenticated])

  const addItem = useCallback(
    async (product, { quantity = 1, variant = '' } = {}) => {
      if (isAuthenticated) {
        try {
          const cart = await store.addToServerCart(product.slug, quantity, variant)
          setItems(mapServerCart(cart))
        } catch (err) {
          toast.error(err.message || 'Could not add to cart')
          return
        }
      } else {
        setItems((prev) => {
          const key = lineKey(product.slug, variant)
          const existing = prev.find((i) => lineKey(i.slug, i.selectedColor) === key)
          if (existing) {
            return prev.map((i) =>
              lineKey(i.slug, i.selectedColor) === key ? { ...i, quantity: i.quantity + quantity } : i,
            )
          }
          return [
            ...prev,
            {
              slug: product.slug,
              title: product.title,
              price: Number(product.price),
              image: product.thumbnail || '',
              selectedColor: variant,
              quantity,
            },
          ]
        })
      }
      toast.success(`${product.title.slice(0, 40)}${product.title.length > 40 ? '…' : ''} added to cart`)
      setCartOpen(true)
    },
    [isAuthenticated],
  )

  const removeItem = useCallback(
    async (slug, variant = '') => {
      if (isAuthenticated) {
        try {
          const cart = await store.removeFromServerCart(slug, variant)
          setItems(mapServerCart(cart))
          return
        } catch (err) {
          toast.error(err.message || 'Could not remove item')
          return
        }
      }
      setItems((prev) => prev.filter((i) => lineKey(i.slug, i.selectedColor) !== lineKey(slug, variant)))
    },
    [isAuthenticated],
  )

  const updateQuantity = useCallback(
    async (slug, variant, quantity) => {
      const safeQuantity = Math.max(1, quantity)
      if (isAuthenticated) {
        try {
          const cart = await store.setServerCartQuantity(slug, safeQuantity, variant || '')
          setItems(mapServerCart(cart))
          return
        } catch (err) {
          toast.error(err.message || 'Could not update quantity')
          return
        }
      }
      setItems((prev) =>
        prev.map((i) =>
          lineKey(i.slug, i.selectedColor) === lineKey(slug, variant) ? { ...i, quantity: safeQuantity } : i,
        ),
      )
    },
    [isAuthenticated],
  )

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        await store.clearServerCart()
      } catch {
        /* best-effort */
      }
    }
    setItems([])
  }, [isAuthenticated])

  const toggleWishlist = useCallback(
    async (product) => {
      const exists = wishlist.some((p) => p.slug === product.slug)
      if (isAuthenticated) {
        try {
          const data = exists
            ? await store.removeFromWishlist(product.slug)
            : await store.addToWishlist(product.slug)
          setWishlist(mapServerWishlist(data))
          toast.success(exists ? 'Removed from wishlist' : 'Added to wishlist')
        } catch (err) {
          toast.error(err.message || 'Could not update wishlist')
        }
        return
      }
      setWishlist((prev) => {
        if (exists) {
          toast('Removed from wishlist')
          return prev.filter((p) => p.slug !== product.slug)
        }
        toast.success('Added to wishlist')
        return [...prev, { slug: product.slug, title: product.title, price: product.price, thumbnail: product.thumbnail }]
      })
    },
    [isAuthenticated, wishlist],
  )

  const isWishlisted = useCallback((slug) => wishlist.some((p) => p.slug === slug), [wishlist])

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items])
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    itemCount,
    isCartOpen,
    setCartOpen,
    wishlist,
    toggleWishlist,
    isWishlisted,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
