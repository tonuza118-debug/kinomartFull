import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(form.username.trim(), form.password)
      toast.success('Welcome back!')
      navigate(location.state?.from || '/account')
    } catch (err) {
      toast.error(err.message || 'Invalid username or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-px mx-auto flex max-w-md flex-col items-center py-16 sm:py-24">
      <Helmet><title>Sign in — Kino Mart</title></Helmet>
      <div className="glass-card w-full p-8">
        <h1 className="font-heading text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">Access your orders, wishlist, and cart.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="Username"
            autoComplete="username"
            required
            className="input-field"
          />
          <input
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            className="input-field"
          />
          <button disabled={submitting} className="btn-primary w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          New here?{' '}
          <Link to="/register" className="font-medium text-neon hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
