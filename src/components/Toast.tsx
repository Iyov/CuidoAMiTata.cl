import React, { useEffect, useState } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  type?: ToastType;
  message: string;
  duration?: number;
  onClose?: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/90',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-800 dark:text-blue-100',
    icon: 'ℹ️',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/90',
    border: 'border-green-200 dark:border-green-700',
    text: 'text-green-800 dark:text-green-100',
    icon: '✓',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/90',
    border: 'border-yellow-200 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-100',
    icon: '⚠️',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/90',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-800 dark:text-red-100',
    icon: '✕',
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const styles = toastStyles[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose(id);
      }
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        border rounded-lg shadow-lg p-4 mb-2 min-w-[300px] max-w-md
        transition-all duration-300 ease-in-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center">
        <span className="text-xl mr-3" aria-hidden="true">
          {styles.icon}
        </span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={handleClose}
          className="ml-3 text-lg hover:opacity-70 transition-opacity"
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionStyles: Record<string, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
  position = 'top-right',
}) => {
  return (
    <div
      className={`fixed ${positionStyles[position]} z-50 flex flex-col`}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};
