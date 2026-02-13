import React from 'react';
import { Button } from './Button';

export type ErrorCode =
  // Validación (1000-1999)
  | 'VALIDATION_REQUIRED_FIELD'
  | 'VALIDATION_ADHERENCE_WINDOW'
  | 'VALIDATION_BED_ELEVATION'
  | 'VALIDATION_INVALID_FORMAT'
  // Conectividad (2000-2999)
  | 'NETWORK_OFFLINE'
  | 'NETWORK_TIMEOUT'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_INVALID_CREDENTIALS'
  // Negocio (3000-3999)
  | 'BUSINESS_CHEMICAL_RESTRAINT_BLOCKED'
  | 'BUSINESS_HISTORICAL_RECORD_IMMUTABLE'
  | 'BUSINESS_JUSTIFICATION_REQUIRED'
  // Sistema (4000-4999)
  | 'SYSTEM_ENCRYPTION_FAILED'
  | 'SYSTEM_STORAGE_QUOTA_EXCEEDED'
  | 'SYSTEM_NOTIFICATION_FAILED'
  | 'SYSTEM_EXPORT_FAILED'
  | 'SYSTEM_ERROR'
  // Sincronización (5000-5999)
  | 'SYNC_CONFLICT'
  | 'SYNC_FAILED'
  | 'SYNC_DATA_INCONSISTENT';

export interface ErrorMessageProps {
  title?: string;
  message?: string;
  errorCode?: ErrorCode;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ERROR_MESSAGES: Record<ErrorCode, { title: string; message: string; actionable: boolean }> = {
  // Validación
  VALIDATION_REQUIRED_FIELD: {
    title: 'Campo obligatorio',
    message: 'Por favor, complete todos los campos obligatorios antes de continuar.',
    actionable: true,
  },
  VALIDATION_ADHERENCE_WINDOW: {
    title: 'Fuera de ventana de adherencia',
    message: 'La administración debe ocurrir dentro de 3 horas del horario programado.',
    actionable: true,
  },
  VALIDATION_BED_ELEVATION: {
    title: 'Elevación inválida',
    message: 'La elevación de la cama no puede exceder 30 grados.',
    actionable: true,
  },
  VALIDATION_INVALID_FORMAT: {
    title: 'Formato inválido',
    message: 'El formato de los datos ingresados no es válido. Por favor, verifique e intente nuevamente.',
    actionable: true,
  },
  
  // Conectividad
  NETWORK_OFFLINE: {
    title: 'Sin conexión',
    message: 'No hay conexión a internet. Los datos se guardarán localmente y se sincronizarán cuando se restablezca la conexión.',
    actionable: false,
  },
  NETWORK_TIMEOUT: {
    title: 'Tiempo de espera agotado',
    message: 'La operación tardó demasiado tiempo. Por favor, verifique su conexión e intente nuevamente.',
    actionable: true,
  },
  AUTH_TOKEN_EXPIRED: {
    title: 'Sesión expirada',
    message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
    actionable: true,
  },
  AUTH_INVALID_CREDENTIALS: {
    title: 'Credenciales inválidas',
    message: 'El correo electrónico o la contraseña son incorrectos. Por favor, intente nuevamente.',
    actionable: true,
  },
  
  // Negocio
  BUSINESS_CHEMICAL_RESTRAINT_BLOCKED: {
    title: 'Restricción química bloqueada',
    message: 'No se pueden usar sedantes para manejo conductual. Consulte las estrategias alternativas.',
    actionable: false,
  },
  BUSINESS_HISTORICAL_RECORD_IMMUTABLE: {
    title: 'Registro histórico protegido',
    message: 'Los registros históricos no pueden ser modificados para mantener la integridad de los datos.',
    actionable: false,
  },
  BUSINESS_JUSTIFICATION_REQUIRED: {
    title: 'Justificación requerida',
    message: 'Debe proporcionar una justificación para omitir esta dosis.',
    actionable: true,
  },
  
  // Sistema
  SYSTEM_ENCRYPTION_FAILED: {
    title: 'Error de cifrado',
    message: 'No se pudieron cifrar los datos. Por favor, intente nuevamente o contacte al soporte técnico.',
    actionable: true,
  },
  SYSTEM_STORAGE_QUOTA_EXCEEDED: {
    title: 'Almacenamiento lleno',
    message: 'El almacenamiento local está lleno. Por favor, exporte y elimine datos antiguos para liberar espacio.',
    actionable: true,
  },
  SYSTEM_NOTIFICATION_FAILED: {
    title: 'Error de notificación',
    message: 'No se pudo enviar la notificación. Verifique los permisos de notificaciones en la configuración.',
    actionable: true,
  },
  SYSTEM_EXPORT_FAILED: {
    title: 'Error de exportación',
    message: 'No se pudo exportar los datos. Por favor, intente nuevamente.',
    actionable: true,
  },
  SYSTEM_ERROR: {
    title: 'Error del sistema',
    message: 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.',
    actionable: true,
  },
  
  // Sincronización
  SYNC_CONFLICT: {
    title: 'Conflicto de sincronización',
    message: 'Se detectó un conflicto al sincronizar los datos. Se ha aplicado la versión más reciente.',
    actionable: false,
  },
  SYNC_FAILED: {
    title: 'Error de sincronización',
    message: 'No se pudieron sincronizar los datos. Los cambios se guardarán localmente e intentarán sincronizarse más tarde.',
    actionable: false,
  },
  SYNC_DATA_INCONSISTENT: {
    title: 'Datos inconsistentes',
    message: 'Se detectaron inconsistencias en los datos. Por favor, contacte al soporte técnico.',
    actionable: true,
  },
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  errorCode,
  details,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const errorInfo = errorCode ? ERROR_MESSAGES[errorCode] : null;
  const displayTitle = title || errorInfo?.title || 'Error';
  const displayMessage = message || errorInfo?.message || 'Ha ocurrido un error.';
  const showRetry = onRetry && (errorInfo?.actionable ?? true);

  return (
    <div
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3 text-red-600 dark:text-red-400" aria-hidden="true">
          ⚠️
        </span>
        <div className="flex-1">
          <h4 className="font-bold text-red-800 dark:text-red-200 mb-1">
            {displayTitle}
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-2">
            {displayMessage}
          </p>
          {details && (
            <details className="text-xs text-red-600 dark:text-red-400 mt-2">
              <summary className="cursor-pointer hover:underline">
                Detalles técnicos
              </summary>
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-x-auto">
                {details}
              </pre>
            </details>
          )}
          {(showRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {showRetry && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={onRetry}
                >
                  Reintentar
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={onDismiss}
                >
                  Cerrar
                </Button>
              )}
            </div>
          )}
        </div>
        {onDismiss && !showRetry && (
          <button
            onClick={onDismiss}
            className="ml-3 text-xl text-red-600 dark:text-red-400 hover:opacity-70 transition-opacity"
            aria-label="Cerrar mensaje de error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
