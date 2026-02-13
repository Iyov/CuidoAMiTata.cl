/**
 * Ejemplos de uso de componentes de manejo de errores
 * 
 * Este archivo muestra cómo usar los componentes de manejo de errores
 * en la aplicación CuidoAMiTata.
 */

import React, { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorMessage } from './ErrorMessage';
import { ToastContainer } from './Toast';
import { ConfirmationModal } from './ConfirmationModal';
import { useToast } from '../hooks/useToast';
import { Button } from './Button';

/**
 * Ejemplo 1: Uso de ErrorBoundary
 * 
 * Envuelve componentes que pueden lanzar errores para capturarlos
 * y mostrar un mensaje de error amigable.
 */
export const ErrorBoundaryExample: React.FC = () => {
  return (
    <ErrorBoundary>
      <div>
        <h2>Contenido protegido por ErrorBoundary</h2>
        <p>Si este componente lanza un error, se mostrará un mensaje de error.</p>
      </div>
    </ErrorBoundary>
  );
};

/**
 * Ejemplo 2: Uso de ErrorMessage
 * 
 * Muestra mensajes de error con códigos predefinidos o personalizados.
 */
export const ErrorMessageExample: React.FC = () => {
  const [showError, setShowError] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowError(!showError)}>
        {showError ? 'Ocultar' : 'Mostrar'} Error
      </Button>

      {showError && (
        <>
          {/* Error con código predefinido */}
          <ErrorMessage
            errorCode="VALIDATION_ADHERENCE_WINDOW"
            onDismiss={() => setShowError(false)}
          />

          {/* Error personalizado */}
          <ErrorMessage
            title="Error personalizado"
            message="Este es un mensaje de error personalizado"
            onRetry={() => console.log('Reintentando...')}
            onDismiss={() => setShowError(false)}
          />

          {/* Error de restricción química */}
          <ErrorMessage
            errorCode="BUSINESS_CHEMICAL_RESTRAINT_BLOCKED"
            details="Intento de registrar sedante para manejo conductual"
          />
        </>
      )}
    </div>
  );
};

/**
 * Ejemplo 3: Uso de Toast con useToast hook
 * 
 * Muestra notificaciones temporales tipo toast.
 */
export const ToastExample: React.FC = () => {
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => showSuccess('Operación exitosa')}>
          Mostrar Éxito
        </Button>
        <Button onClick={() => showError('Ha ocurrido un error')}>
          Mostrar Error
        </Button>
        <Button onClick={() => showWarning('Advertencia importante')}>
          Mostrar Advertencia
        </Button>
        <Button onClick={() => showInfo('Información útil')}>
          Mostrar Info
        </Button>
      </div>

      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position="top-right"
      />
    </div>
  );
};

/**
 * Ejemplo 4: Uso de ConfirmationModal
 * 
 * Muestra un modal de confirmación para acciones críticas.
 */
export const ConfirmationModalExample: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDangerModal, setShowDangerModal] = useState(false);

  const handleConfirm = () => {
    console.log('Acción confirmada');
    setShowModal(false);
  };

  const handleDangerConfirm = () => {
    console.log('Acción peligrosa confirmada');
    setShowDangerModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setShowModal(true)}>
          Mostrar Confirmación Normal
        </Button>
        <Button onClick={() => setShowDangerModal(true)} variant="danger">
          Mostrar Confirmación Peligrosa
        </Button>
      </div>

      {/* Modal de confirmación normal */}
      <ConfirmationModal
        isOpen={showModal}
        title="Exportar datos"
        message="¿Está seguro de que desea exportar los datos del paciente?"
        confirmText="Exportar"
        cancelText="Cancelar"
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />

      {/* Modal de confirmación peligrosa */}
      <ConfirmationModal
        isOpen={showDangerModal}
        title="Eliminar paciente"
        message="Esta acción eliminará permanentemente todos los datos del paciente. Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmVariant="danger"
        isDangerous={true}
        onConfirm={handleDangerConfirm}
        onCancel={() => setShowDangerModal(false)}
      />
    </div>
  );
};

/**
 * Ejemplo 5: Uso completo en una aplicación
 * 
 * Muestra cómo integrar todos los componentes de manejo de errores.
 */
export const CompleteErrorHandlingExample: React.FC = () => {
  const { toasts, showSuccess, showError, removeToast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleOmitDose = () => {
    setShowConfirmation(true);
  };

  const handleConfirmOmit = () => {
    // Simular omisión de dosis
    showSuccess('Dosis omitida correctamente');
    setShowConfirmation(false);
  };

  const handleError = () => {
    showError('No se pudo guardar los cambios. Por favor, intente nuevamente.');
  };

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Gestión de Medicamentos</h1>

        {/* Mensaje de error de validación */}
        <ErrorMessage
          errorCode="BUSINESS_JUSTIFICATION_REQUIRED"
          onDismiss={() => console.log('Error dismissed')}
        />

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button onClick={handleOmitDose}>
            Omitir Dosis
          </Button>
          <Button onClick={handleError} variant="danger">
            Simular Error
          </Button>
        </div>

        {/* Modal de confirmación */}
        <ConfirmationModal
          isOpen={showConfirmation}
          title="Omitir dosis"
          message="¿Está seguro de que desea omitir esta dosis? Debe proporcionar una justificación."
          confirmText="Omitir"
          cancelText="Cancelar"
          onConfirm={handleConfirmOmit}
          onCancel={() => setShowConfirmation(false)}
        />

        {/* Contenedor de toasts */}
        <ToastContainer
          toasts={toasts}
          onRemove={removeToast}
          position="top-right"
        />
      </div>
    </ErrorBoundary>
  );
};
