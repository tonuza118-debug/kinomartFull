import { useEffect, useRef, useState } from 'react'
import { Share2, Link2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

// Minimal brand marks (not in lucide, which is outline-icons-only) — kept as
// tiny inline SVGs rather than pulling in a whole icon-pack dependency.
function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2.05 22l5.42-1.32c1.36.74 2.92 1.16 4.57 1.16 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.1.28-3.71-.79-3.12-1.28-5.13-4.47-5.28-4.68-.15-.21-1.26-1.68-1.26-3.2 0-1.53.8-2.27 1.09-2.58.28-.31.62-.39.82-.39.21 0 .41 0 .59.01.19.01.44-.07.69.53.25.6.85 2.07.93 2.22.08.15.13.33.02.54-.1.21-.15.34-.3.52-.15.18-.31.4-.44.54-.15.15-.3.31-.13.6.17.3.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.37 1.47.3.15.47.13.65-.07.17-.21.75-.87.95-1.17.2-.3.4-.24.66-.15.27.1 1.71.81 2 .96.3.15.49.22.56.35.08.13.08.72-.16 1.4z"/>
    </svg>
  )
}
function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-8.1h2.72l.4-3.16h-3.12V7.7c0-.92.25-1.54 1.57-1.54h1.68V3.34C15.98 3.24 15 3.15 13.85 3.15c-2.4 0-4.05 1.47-4.05 4.16v2.6H7.06v3.15h2.74V21h3.7z"/>
    </svg>
  )
}
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.24 3h3.06l-6.69 7.64L22.5 21h-6.16l-4.82-6.3L5.99 21H2.93l7.16-8.18L2 3h6.32l4.36 5.76L18.24 3zm-1.07 16.17h1.7L7.9 4.74H6.08l11.09 14.43z"/>
    </svg>
  )
}

export default function ShareButton({ title, text, url, className = '' }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleShareClick() {
    // Web Share API opens the device's native share sheet — this is what
    // most phones (and the apps people actually share to, WhatsApp chief
    // among them in Bangladesh) show up in automatically. Fall back to a
    // dropdown of direct share links on desktop browsers that lack it.
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        /* user backed out of the native share sheet — nothing to do */
      }
      return
    }
    setOpen((v) => !v)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy the link')
    }
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text || title)

  const links = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`, Icon: WhatsAppIcon },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, Icon: FacebookIcon },
    { name: 'X (Twitter)', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`, Icon: XIcon },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleShareClick}
        className={`btn-icon h-12 w-12 ${className}`}
        aria-label="Share this product"
      >
        <Share2 size={18} />
      </button>

      {open && (
        <div className="glass-card absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden p-1.5">
          {links.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {name}
            </a>
          ))}
          <button
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            {copied ? <Check className="h-4 w-4 shrink-0 text-neon" /> : <Link2 className="h-4 w-4 shrink-0" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}
