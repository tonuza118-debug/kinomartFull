import { useEffect, useState } from 'react'
import { msUntilMidnight } from '../../lib/format'

function split(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    h: String(Math.floor(total / 3600)).padStart(2, '0'),
    m: String(Math.floor((total % 3600) / 60)).padStart(2, '0'),
    s: String(total % 60).padStart(2, '0'),
  }
}

export default function CountdownTimer({ label = 'Deal ends in' }) {
  const [remaining, setRemaining] = useState(msUntilMidnight())

  useEffect(() => {
    const id = setInterval(() => setRemaining(msUntilMidnight()), 1000)
    return () => clearInterval(id)
  }, [])

  const { h, m, s } = split(remaining)

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-ink-muted">{label}</span>
      <div className="flex gap-1 font-heading font-bold text-neon">
        {[h, m, s].map((v, i) => (
          <span key={i} className="rounded-md bg-black/50 px-2 py-1 tabular-nums">
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}
