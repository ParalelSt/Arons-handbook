import { cn } from "@/lib/utils";

type BadgeVariant = "accent" | "success" | "danger" | "warning" | "muted";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  accent:  { bg: "var(--accent-soft)", text: "var(--accent-primary)" },
  success: { bg: "var(--surface-success)", text: "var(--success)" },
  danger:  { bg: "var(--surface-danger)", text: "var(--danger)" },
  warning: { bg: "rgba(245, 158, 11, 0.15)", text: "var(--warning)" },
  muted:   { bg: "var(--surface-tertiary)", text: "var(--text-muted)" },
};

export function Badge({ children, variant = "accent", className }: BadgeProps) {
  const style = variantStyles[variant];
  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold", className)}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {children}
    </span>
  );
}
