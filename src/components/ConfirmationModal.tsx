import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  isDangerous = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Enfocar el botón de cancelar cuando se abre el modal
      cancelButtonRef.current?.focus();

      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';

      // Manejar tecla Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
    return undefined;
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in"
      >
        {/* Icono de advertencia para acciones peligrosas */}
        {isDangerous && (
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="text-2xl" aria-hidden="true">⚠️</span>
            </div>
          </div>
        )}

        {/* Título */}
        <h2
          id="modal-title"
          className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 text-center"
        >
          {title}
        </h2>

        {/* Mensaje */}
        <p
          id="modal-description"
          className="text-gray-700 dark:text-gray-300 mb-6 text-center"
        >
          {message}
        </p>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant === 'danger' ? 'primary' : 'primary'}
            onClick={onConfirm}
            className={confirmVariant === 'danger' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
