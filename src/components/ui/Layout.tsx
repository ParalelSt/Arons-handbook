import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { getTheme } from "@/lib/theme";
import { ThemeSelector } from "./ThemeSelector";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  const { currentTheme } = useTheme();
  const theme = getTheme(currentTheme);

  return (
    <div
      className={cn(
        `min-h-screen bg-gradient-to-br ${theme.colors.bg.gradient}`,
        className
      )}
    >
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
    <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 text-slate-300"
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
          <h1 className="text-lg sm:text-xl font-bold text-white truncate">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {action && <div className="flex-shrink-0">{action}</div>}
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
        "bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700",
        "hover:border-slate-600 transition-all duration-200",
        onClick && "cursor-pointer hover:bg-slate-800/70",
        className
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
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  disabled = false,
}: ButtonProps) {
  const { currentTheme } = useTheme();
  const theme = getTheme(currentTheme);

  const variants = {
    primary: theme.colors.button.primary,
    secondary: theme.colors.button.secondary,
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
