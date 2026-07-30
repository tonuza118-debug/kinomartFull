import { useState } from 'react'
import toast from 'react-hot-toast'
import { Mail } from 'lucide-react'

export default function Newsletter({ compact = false }) {
  const [email, setEmail] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!email.includes('@')) {
      toast.error('Enter a valid email')
      return
    }
    // Note: no /api/newsletter endpoint exists on the backend yet — this is a
    // local acknowledgement only. Wire this up once that endpoint is added.
    toast.success("You're on the list!")
    setEmail('')
  }

  return (
    <div className={compact ? '' : 'container-px mx-auto max-w-7xl py-16'}>
      <div className="glass-card flex flex-col items-center gap-6 px-6 py-10 text-center sm:px-12 md:flex-row md:justify-between md:text-left">
        <div>
          <p className="section-eyebrow mb-2">Stay sharp</p>
          <h3 className="font-heading text-xl font-bold sm:text-2xl">
            Get early access to drops and flash sales
          </h3>
        </div>
        <form onSubmit={submit} className="flex w-full max-w-sm gap-2">
          <div className="glass flex flex-1 items-center gap-2 rounded-full px-4 py-3">
            <Mail size={15} className="text-ink-faint" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@email.com"
              aria-label="Email address"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 !px-5">
            Join
          </button>
        </form>
      </div>
    </div>
  )
}
