"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-primary p-4",
        hoverable && "cursor-pointer hover:bg-elevated transition-colors active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
