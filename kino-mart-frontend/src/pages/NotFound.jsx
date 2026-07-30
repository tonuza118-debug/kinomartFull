import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <div className="container-px mx-auto flex max-w-2xl flex-col items-center py-32 text-center">
      <Helmet><title>Page not found — Kino Mart</title></Helmet>
      <span className="font-display text-6xl font-bold text-neon">404</span>
      <h1 className="mt-4 font-heading text-2xl font-bold">This page took a wrong turn</h1>
      <p className="mt-2 text-ink-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-8">Back to home</Link>
    </div>
  )
}
