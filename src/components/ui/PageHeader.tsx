"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, backHref, action }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 px-4 py-4 md:px-6 md:py-5">
      {backHref && (
        <button
          onClick={() => router.push(backHref)}
          className="p-2 -ml-2 rounded-lg text-muted hover:text-primary hover:bg-elevated transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-primary truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5 truncate">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
