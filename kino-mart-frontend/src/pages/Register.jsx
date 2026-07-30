import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', phone_number: '' })
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await register(form)
      toast.success('Account created!')
      navigate('/account')
    } catch (err) {
      toast.error(err.message || 'Could not create account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-px mx-auto flex max-w-md flex-col items-center py-16 sm:py-24">
      <Helmet><title>Create account — Kino Mart</title></Helmet>
      <div className="glass-card w-full p-8">
        <h1 className="font-heading text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">Save your wishlist and track orders in one place.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            placeholder="Username"
            autoComplete="username"
            required
            className="input-field"
          />
          <input
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="input-field"
          />
          <input
            value={form.phone_number}
            onChange={(e) => update('phone_number', e.target.value)}
            placeholder="Phone number"
            autoComplete="tel"
            className="input-field"
          />
          <input
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            required
            className="input-field"
          />
          <button disabled={submitting} className="btn-primary w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-neon hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
