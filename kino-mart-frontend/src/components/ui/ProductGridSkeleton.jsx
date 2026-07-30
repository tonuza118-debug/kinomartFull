export default function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card overflow-hidden">
          <div className="skeleton aspect-square w-full" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="skeleton h-5 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
