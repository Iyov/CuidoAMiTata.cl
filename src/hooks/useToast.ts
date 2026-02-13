import { useState, useCallback } from 'react';
import { ToastProps, ToastType } from '../components/Toast';

let toastIdCounter = 0;

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

export interface UseToastReturn {
  toasts: ToastProps[];
  showToast: (message: string, options?: ToastOptions) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: ToastProps = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration ?? 5000,
      onClose: removeToast,
    };

    setToasts((prev) => [...prev, newToast]);
  }, [removeToast]);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'success', duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'error', duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'warning', duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, { type: 'info', duration });
  }, [showToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAll,
  };
};
