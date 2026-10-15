import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="shrink-0 w-5 h-5 text-content-feedback-success" />,
    error: <XCircle className="shrink-0 w-5 h-5 text-content-feedback-error" />,
    info: <AlertCircle className="shrink-0 w-5 h-5 text-content-feedback-info" />
  };

  const backgrounds = {
    success: 'bg-surface-feedback-success border-stroke-default',
    error: 'bg-surface-feedback-error border-stroke-default',
    info: 'bg-surface-feedback-info border-stroke-default'
  };

  const textColors = {
    success: 'text-content-primary',
    error: 'text-content-primary',
    info: 'text-content-primary'
  };

  return (
    <div className={`flex items-center gap-3 max-w-full px-4 py-3 rounded-lg border shadow-lg ${backgrounds[type]} animate-slide-in`}>
      {icons[type]}
      <p className={`min-w-0 break-words text-sm font-medium flex-1 ${textColors[type]}`}>{message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onClose(id)}
        className={`p-1 rounded hover:bg-white/50 transition-colors ${textColors[type]}`}
      >
        <X className="shrink-0 w-4 h-4" />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
