"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styleMap: Record<ToastType, string> = {
  success: "border-success text-success",
  error: "border-danger text-danger",
  info: "border-info text-info",
};

export function Toast({ message, type = "info", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const Icon = iconMap[type];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl bg-floating border shadow-xl",
          styleMap[type],
        )}
      >
        <Icon size={18} />
        <span className="text-sm font-medium text-primary">{message}</span>
        <button onClick={onClose} className="p-0.5 text-muted hover:text-primary">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
