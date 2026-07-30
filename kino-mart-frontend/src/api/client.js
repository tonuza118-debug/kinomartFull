import axios from 'axios'

// In dev, Vite proxies /api and /media to VITE_API_PROXY_TARGET (see vite.config.js).
// In prod, set VITE_API_BASE_URL to the deployed Django origin, e.g. https://api.kinomart.com
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const MEDIA_ORIGIN = import.meta.env.VITE_MEDIA_ORIGIN || API_BASE_URL

const ACCESS_KEY = 'kinomart_access_token'
const REFRESH_KEY = 'kinomart_refresh_token'

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
})

// Django ImageField returns an absolute-ish path like /media/products/x.jpg (or a full
// absolute URL if MEDIA origin is already set on the backend). Normalize to always work.
export function mediaUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  return `${MEDIA_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`
}

api.interceptors.request.use((config) => {
  const access = tokenStore.getAccess()
  if (access) config.headers.Authorization = `Bearer ${access}`
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')

    // On a 401 (expired access token), try exactly one silent refresh-and-retry.
    if (err.response?.status === 401 && !original._retried && !isAuthEndpoint && tokenStore.getRefresh()) {
      original._retried = true
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post('/auth/refresh/', { refresh: tokenStore.getRefresh() })
            .then((r) => r.data.access)
            .finally(() => {
              refreshPromise = null
            })
        }
        const newAccess = await refreshPromise
        tokenStore.set(newAccess, null)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch {
        tokenStore.clear()
      }
    }

    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.[0] ||
      (typeof err?.response?.data === 'object' && err?.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : null) ||
      err?.message ||
      'Something went wrong. Please try again.'
    return Promise.reject(new Error(message))
  },
)
