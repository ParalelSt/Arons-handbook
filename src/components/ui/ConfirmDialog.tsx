import { Button } from "./Layout";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-card rounded-2xl border border-primary max-w-sm w-full p-6 sm:p-8">
        <h2 className="text-lg sm:text-xl font-bold text-primary mb-2">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            variant={isDestructive ? "danger" : "primary"}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
