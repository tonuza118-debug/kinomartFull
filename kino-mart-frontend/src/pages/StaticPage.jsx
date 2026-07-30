import { Helmet } from 'react-helmet-async'

export default function StaticPage({ title, children }) {
  return (
    <div className="container-px mx-auto max-w-3xl py-16">
      <Helmet><title>{title} — Kino Mart</title></Helmet>
      <h1 className="mb-6 font-heading text-3xl font-bold">{title}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-muted">{children}</div>
    </div>
  )
}
