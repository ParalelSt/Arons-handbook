import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface ToastProps {
  message: string;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({ message, duration = 4000, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-success-surface border border-(--success) rounded-lg p-4 sm:p-5 flex items-center gap-3 max-w-sm">
        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success shrink-0" />
        <p className="text-sm sm:text-base text-primary">{message}</p>
      </div>
    </div>
  );
}
