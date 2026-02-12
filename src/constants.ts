/**
 * Constantes de la aplicación CuidoAMiTata
 */

// Ventana de adherencia para medicamentos (en minutos)
export const ADHERENCE_WINDOW_MINUTES = 90; // ±1.5 horas

// Elevación máxima de cama (en grados)
export const MAX_BED_ELEVATION_DEGREES = 30;

// Intervalo de cambios posturales diurnos (en horas)
export const DAYTIME_POSTURAL_CHANGE_INTERVAL_HOURS = 2;

// Número de cambios posturales nocturnos
export const NIGHTTIME_POSTURAL_CHANGES_COUNT = 3;

// Horarios de día y noche
export const DAYTIME_START_HOUR = 6; // 06:00
export const DAYTIME_END_HOUR = 22; // 22:00

// Objetivo de hidratación diaria (vasos)
export const DAILY_HYDRATION_TARGET_MIN = 6;
export const DAILY_HYDRATION_TARGET_MAX = 8;

// Intervalo de recordatorios de baño (en horas)
export const BATHROOM_REMINDER_INTERVAL_MIN_HOURS = 2;
export const BATHROOM_REMINDER_INTERVAL_MAX_HOURS = 3;

// Tiempo de inactividad para auto-logout (en minutos)
export const AUTO_LOGOUT_MINUTES = 15;

// Tiempo para recordatorio de notificación desatendida (en minutos)
export const UNATTENDED_NOTIFICATION_REMINDER_MINUTES = 15;

// Número de comidas diarias según SEGG
export const SEGG_DAILY_MEALS_COUNT = 5;

// Umbrales de stock y caducidad
export const LOW_STOCK_THRESHOLD = 5; // dosis
export const EXPIRATION_WARNING_DAYS = 30; // días

// Configuración de cifrado
export const ENCRYPTION_ALGORITHM = 'AES-256';

// Configuración de pruebas de propiedades
export const PROPERTY_TEST_RUNS = 100;

// Mensajes de error en español
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio',
  ADHERENCE_WINDOW: 'La administración debe ocurrir dentro de 3 horas del horario programado',
  BED_ELEVATION: 'La elevación de la cama no puede exceder 30 grados',
  JUSTIFICATION_REQUIRED: 'Debe proporcionar una justificación para esta acción',
  CHEMICAL_RESTRAINT_BLOCKED:
    'No se pueden usar sedantes para manejo conductual. Consulte las estrategias alternativas.',
  HISTORICAL_RECORD_IMMUTABLE: 'Los registros históricos no pueden ser modificados',
  NETWORK_OFFLINE: 'Sin conexión a internet. Los datos se guardarán localmente.',
  STORAGE_QUOTA_EXCEEDED: 'Espacio de almacenamiento insuficiente',
  ENCRYPTION_FAILED: 'Error al cifrar los datos',
  SYNC_FAILED: 'Error al sincronizar los datos',
} as const;
