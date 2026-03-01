import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeSelector } from "./ThemeSelector";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("min-h-screen bg-surface", className)}>
      {children}
    </div>
  );
}

interface HeaderProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}

export function Header({ title, onBack, action }: HeaderProps) {
  return (
    <header className="bg-card border-b border-primary sticky top-0 z-10">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-elevated rounded-lg transition-colors shrink-0"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-primary truncate">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {action && <div className="shrink-0">{action}</div>}
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-primary transition-colors duration-200",
        onClick && "cursor-pointer hover:bg-elevated",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-label"?: string;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  disabled = false,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-accent-primary hover:bg-accent text-primary"
      : variant === "secondary"
        ? "bg-elevated hover:bg-elevated text-primary"
        : "bg-danger text-primary";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClass,
        className,
      )}
    >
      {children}
    </button>
  );
}
