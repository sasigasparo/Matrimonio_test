/*
 * Skeleton placeholder — shimmer block for loading states.
 * Honours prefers-reduced-motion (the shimmer is disabled via CSS).
 */
export default function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-sm)', style, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`}
      aria-hidden="true"
      style={{ display: 'block', width, height, borderRadius: radius, ...style }}
    />
  )
}

// Convenience: a card-shaped skeleton matching the app's card radius.
export function SkeletonCard({ height = 120, style }) {
  return <Skeleton height={height} radius="var(--radius-lg)" style={style} />
}
