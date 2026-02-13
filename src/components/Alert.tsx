import React from 'react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  type?: AlertType;
  variant?: AlertType; // Alias para type
  title?: string;
  message?: string;
  children?: React.ReactNode; // Soporte para children
  onClose?: () => void;
  className?: string;
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; icon: string }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'ℹ️',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: '✓',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: '⚠️',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: '✕',
  },
};

export const Alert: React.FC<AlertProps> = ({
  type,
  variant,
  title,
  message,
  children,
  onClose,
  className = '',
}) => {
  // Usar variant si está presente, sino type, sino 'info'
  const alertType = variant || type || 'info';
  const styles = alertStyles[alertType];
  
  // Usar children si está presente, sino message
  const content = children || message;
  
  // ACCESIBILIDAD: Determinar el rol ARIA apropiado según el tipo
  const ariaRole = alertType === 'error' || alertType === 'warning' ? 'alert' : 'status';
  const ariaLive = alertType === 'error' ? 'assertive' : 'polite';

  return (
    <div
      className={`${styles.bg} ${styles.border} ${styles.text} border rounded-lg p-4 ${className}`}
      role={ariaRole}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3" aria-hidden="true">
          {styles.icon}
        </span>
        <div className="flex-1">
          {title && (
            <h4 className="font-bold mb-1">{title}</h4>
          )}
          <div className="text-sm">{content}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-xl hover:opacity-70 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar alerta"
            type="button"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
