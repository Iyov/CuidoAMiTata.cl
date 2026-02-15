/**
 * PanicButton Component
 * Botón de emergencia prominente para alertar a la familia
 */

import React, { useState } from 'react';
import { Button } from './Button';
import { ConfirmationModal } from './ConfirmationModal';
import { useToast } from '../hooks/useToast';
import { getPanicManager } from '../services/PanicManager';
import { useFamily } from '../contexts/FamilyContext';
import { supabase } from '../config/supabase';

export interface PanicButtonProps {
  patientId: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'fixed' | 'inline';
  className?: string;
}

export const PanicButton: React.FC<PanicButtonProps> = ({
  patientId,
  size = 'large',
  position = 'inline',
  className = '',
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const { showToast } = useToast();
  const { currentFamily } = useFamily();
  const panicManager = getPanicManager();

  /**
   * Maneja el clic en el botón de pánico
   */
  const handlePanicClick = () => {
    setShowConfirmation(true);
  };

  /**
   * Maneja la confirmación del pánico
   */
  const handleConfirm = async () => {
    if (!currentFamily) {
      showToast('Error: No hay familia seleccionada', { type: 'error' });
      setShowConfirmation(false);
      return;
    }

    setIsTriggering(true);

    try {
      // Obtener usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        showToast('Error: Usuario no autenticado', { type: 'error' });
        setIsTriggering(false);
        setShowConfirmation(false);
        return;
      }

      // Registrar evento de pánico
      const result = await panicManager.triggerPanic(
        patientId,
        user.id,
        currentFamily.id
      );

      if (result.ok) {
        showToast('¡Alerta de emergencia enviada! La familia ha sido notificada.', { type: 'success' });
      } else {
        showToast(`Error al enviar alerta: ${result.error.message}`, { type: 'error' });
      }
    } catch (error) {
      console.error('Error al activar pánico:', error);
      showToast('Error inesperado al enviar alerta de emergencia', { type: 'error' });
    } finally {
      setIsTriggering(false);
      setShowConfirmation(false);
    }
  };

  /**
   * Maneja la cancelación
   */
  const handleCancel = () => {
    setShowConfirmation(false);
  };

  // Clases de tamaño
  const sizeClasses = {
    small: 'px-4 py-2 text-sm min-h-[44px]',
    medium: 'px-6 py-3 text-base min-h-[52px]',
    large: 'px-8 py-4 text-lg min-h-[60px]',
  };

  // Clases de posición
  const positionClasses = position === 'fixed'
    ? 'fixed bottom-6 right-6 z-50 shadow-2xl'
    : '';

  return (
    <>
      <Button
        variant="danger"
        onClick={handlePanicClick}
        disabled={isTriggering}
        className={`
          ${sizeClasses[size]}
          ${positionClasses}
          ${className}
          font-bold
          shadow-lg
          hover:shadow-xl
          transition-all
          duration-200
          flex
          items-center
          gap-2
        `}
        aria-label="Botón de emergencia - Alertar a la familia"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>EMERGENCIA</span>
      </Button>

      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title="¿Confirmar alerta de emergencia?"
        message="Se enviará una notificación inmediata a todos los miembros de la familia. Use solo en caso de emergencia real."
        confirmText="Sí, enviar alerta"
        cancelText="Cancelar"
        confirmVariant="danger"
        isDangerous={true}
      />
    </>
  );
};
