import React from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastVariants = {
  default: {
    className: "bg-white border border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
    icon: Info
  },
  destructive: {
    className: "bg-red-50 border border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100",
    icon: XCircle
  },
  success: {
    className: "bg-green-50 border border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100",
    icon: CheckCircle
  },
  warning: {
    className: "bg-yellow-50 border border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100",
    icon: AlertCircle
  }
};

export const Toast = ({ toast, onDismiss }) => {
  const variant = toastVariants[toast.variant] || toastVariants.default;
  const IconComponent = variant.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out",
        variant.className
      )}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <IconComponent className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="font-medium text-sm">
              {toast.title}
            </div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90 mt-1">
              {toast.description}
            </div>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};