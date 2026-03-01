interface SkeletonCardProps {
  lines?: number;
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
      className={`bg-card rounded-xl border border-primary p-5 space-y-3 ${className}`}
      role="status"
      aria-label="Loading…"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded bg-elevated"
          style={{
            height,
            width: i === lines - 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}

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
