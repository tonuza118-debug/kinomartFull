import { Link } from 'react-router-dom'
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react'
import Logo from '../ui/Logo.jsx'
import Newsletter from '../home/Newsletter.jsx'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-base-soft/60">
      <div className="container-px mx-auto max-w-7xl py-14">
        <Newsletter compact />

        <div className="mt-14 grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              Sharp, premium gadgets and everyday essentials — delivered fast across Bangladesh,
              with cash on delivery in every district.
            </p>
            <div className="mt-5 flex gap-3">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="btn-icon" aria-label="Social link">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Shop"
            links={[
              { label: 'All products', to: '/shop' },
              { label: 'Hot deals', to: '/shop?section=hot' },
              { label: 'Trending', to: '/shop?section=trending' },
              { label: 'Brands', to: '/brands' },
              { label: 'Wishlist', to: '/wishlist' },
            ]}
          />
          <FooterCol
            title="Support"
            links={[
              { label: 'Track my order', to: '/track-order' },
              { label: 'Shipping & delivery', to: '/shipping' },
              { label: 'Returns policy', to: '/returns' },
              { label: 'Contact us', to: '/contact' },
            ]}
          />
          <div>
            <h4 className="section-eyebrow mb-4">Reach us</h4>
            <ul className="space-y-3 text-sm text-ink-muted">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-neon" /> Gulshan Ave, Dhaka, Bangladesh
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-neon" /> +880 1XXX-XXXXXX
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-neon" /> hello@kinomart.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} Kino Mart. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-neon">Privacy</Link>
            <Link to="/terms" className="hover:text-neon">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="section-eyebrow mb-4">{title}</h4>
      <ul className="space-y-3 text-sm text-ink-muted">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="transition-colors hover:text-neon">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
