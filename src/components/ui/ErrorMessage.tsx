import { AlertCircle, X } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="bg-danger-surface border border-danger rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-secondary">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-elevated rounded transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        )}
      </div>
    </div>
  );
}
