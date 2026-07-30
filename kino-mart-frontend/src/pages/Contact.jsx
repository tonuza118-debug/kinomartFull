import { useState } from 'react'
import StaticPage from './StaticPage.jsx'
import toast from 'react-hot-toast'
import { submitContactMessage } from '../api/storefront'

const EMPTY = { name: '', email: '', phone_number: '', subject: '', message: '' }

export default function Contact() {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in your name, email, and message.')
      return
    }
    setLoading(true)
    try {
      await submitContactMessage(form)
      setSent(true)
      setForm(EMPTY)
      toast.success('Message sent — we\'ll get back to you soon.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <StaticPage title="Contact us">
      <p>Email: hello@kinomart.com</p>
      <p>Phone: +880 1XXX-XXXXXX (10am–8pm, Sat–Thu)</p>
      <p>Address: Gulshan Ave, Dhaka, Bangladesh</p>

      <form onSubmit={submit} className="mt-6 grid max-w-lg gap-3">
        <input value={form.name} onChange={update('name')} placeholder="Your name" className="input-field" />
        <input value={form.email} onChange={update('email')} type="email" placeholder="Email address" className="input-field" />
        <input value={form.phone_number} onChange={update('phone_number')} placeholder="Phone number (optional)" className="input-field" />
        <input value={form.subject} onChange={update('subject')} placeholder="Subject (optional)" className="input-field" />
        <textarea
          value={form.message}
          onChange={update('message')}
          placeholder="How can we help?"
          rows={5}
          className="input-field resize-none"
        />
        <button className="btn-primary w-fit" disabled={loading}>
          {loading ? 'Sending…' : 'Send message'}
        </button>
        {sent && <p className="text-xs text-ink-faint">Thanks — we've received your message.</p>}
      </form>
    </StaticPage>
  )
}
