/**
 * SkeletonCard
 *
 * Animated placeholder shown while content loads.
 * Use instead of plain "Loading…" text for a professional feel.
 *
 * Usage:
 *   <SkeletonCard lines={3} />          — card with 3 shimmer lines
 *   <SkeletonCard lines={2} height={20} /> — taller shimmer lines
 */

interface SkeletonCardProps {
  /** Number of shimmer lines to render inside the card */
  lines?: number;
  /** Height of each line in pixels (default: 14) */
  height?: number;
  className?: string;
}

export function SkeletonCard({
  lines = 3,
  height = 14,
  className = "",
}: SkeletonCardProps) {
  return (
    <div
      className={`bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 space-y-3 ${className}`}
      role="status"
      aria-label="Loading…"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded bg-slate-700/60"
          style={{
            height,
            width: i === lines - 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}

/** Convenience: renders N skeleton cards stacked */
export function SkeletonList({
  count = 3,
  lines = 3,
}: {
  count?: number;
  lines?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}
