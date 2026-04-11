import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card rounded-xl border border-primary p-4 animate-pulse", className)}>
      <div className="h-4 bg-elevated rounded w-2/3 mb-3" />
      <div className="h-3 bg-elevated rounded w-1/2 mb-2" />
      <div className="h-3 bg-elevated rounded w-1/3" />
    </div>
  );
}
