import { api } from './client'

// GET /api/categories/
export async function getCategories() {
  const { data } = await api.get('/categories/')
  return Array.isArray(data) ? data : data.results ?? []
}

// GET /api/brands/
export async function getBrands() {
  const { data } = await api.get('/brands/')
  return Array.isArray(data) ? data : data.results ?? []
}

// GET /api/districts/  (used for shipping-charge lookup at checkout)
export async function getDistricts() {
  const { data } = await api.get('/districts/')
  return Array.isArray(data) ? data : data.results ?? []
}

// GET /api/products/?section_type=&category=&in_stock=&page=
// Backend paginates 20/page (DRF PageNumberPagination) and supports
// exact-match filters via django-filter: section_type, category, in_stock.
export async function getProducts(params = {}) {
  const { data } = await api.get('/products/', { params })
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null }
  }
  return data // { count, next, previous, results }
}

// GET /api/products/{slug}/
export async function getProductBySlug(slug) {
  const { data } = await api.get(`/products/${slug}/`)
  return data
}
