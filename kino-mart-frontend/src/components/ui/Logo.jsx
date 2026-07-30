export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#0B0B0B" stroke="#E9FF00" strokeOpacity="0.25" />
        <path d="M18 12h9v16.5L39 12h11L34 30l17 22H40L27 34.5V44h-9z" fill="#E9FF00" />
      </svg>
      <span className="font-display text-xl font-bold leading-none tracking-tight text-ink">
        KINO<span className="text-neon">MART</span>
      </span>
    </div>
  )
}
