import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
}

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav
      className={cn(
        "px-3 sm:px-4 py-2 bg-elevated border-b border-primary",
        "overflow-x-auto whitespace-nowrap text-xs sm:text-sm text-secondary",
        "flex items-center gap-1",
        className,
      )}
      aria-label="Breadcrumb"
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  "hover:text-primary transition-colors",
                  isLast && "font-semibold text-primary",
                )}
              >
                {item.label}
              </button>
            ) : (
              <span className={cn(isLast && "font-semibold text-primary")}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="text-muted">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
