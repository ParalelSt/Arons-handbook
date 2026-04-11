"use client";

import { Trophy } from "lucide-react";

export function PRBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
      <Trophy size={10} />
      PR
    </span>
  );
}
