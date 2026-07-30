export function formatBDT(value) {
  const n = Number(value || 0)
  return `৳${n.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`
}

export function discountPercent(price, originalPrice) {
  const p = Number(price)
  const o = Number(originalPrice)
  if (!o || o <= p) return 0
  return Math.round(((o - p) / o) * 100)
}

export function msUntilMidnight() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}
