/**
 * Códigos de error del sistema CuidoAMiTata
 */
export enum ErrorCode {
  // Validación (1000-1999)
  VALIDATION_REQUIRED_FIELD = 1001,
  VALIDATION_ADHERENCE_WINDOW = 1002,
  VALIDATION_BED_ELEVATION = 1003,
  VALIDATION_INVALID_FORMAT = 1004,

  // Conectividad (2000-2999)
  NETWORK_OFFLINE = 2001,
  NETWORK_TIMEOUT = 2002,
  AUTH_TOKEN_EXPIRED = 2003,
  AUTH_INVALID_CREDENTIALS = 2004,

  // Negocio (3000-3999)
  BUSINESS_CHEMICAL_RESTRAINT_BLOCKED = 3001,
  BUSINESS_HISTORICAL_RECORD_IMMUTABLE = 3002,
  BUSINESS_JUSTIFICATION_REQUIRED = 3003,

  // Sistema (4000-4999)
  SYSTEM_ENCRYPTION_FAILED = 4001,
  SYSTEM_STORAGE_QUOTA_EXCEEDED = 4002,
  SYSTEM_NOTIFICATION_FAILED = 4003,
  SYSTEM_EXPORT_FAILED = 4004,

  // Sincronización (5000-5999)
  SYNC_CONFLICT = 5001,
  SYNC_FAILED = 5002,
  SYNC_DATA_INCONSISTENT = 5003,

  // Bitácora (6000-6099)
  BITACORA_FUTURE_DATE = 6001,
  BITACORA_EMPTY_ENTRY = 6002,
  BITACORA_EDIT_EXPIRED = 6003,

  // Familia (6100-6199)
  FAMILY_NOT_ADMIN = 6101,
  FAMILY_LAST_ADMIN = 6102,
  FAMILY_INVALID_EMAIL = 6103,
  FAMILY_MEMBER_EXISTS = 6104,

  // Pánico (6200-6299)
  PANIC_NO_RECIPIENTS = 6201,
  PANIC_EMAIL_FAILED = 6202,

  // Auth (6300-6399)
  AUTH_INVALID_TOKEN = 6301,
  AUTH_EXPIRED_TOKEN = 6302,

  // Permisos (6400-6499)
  PERMISSION_DENIED = 6401,
  PERMISSION_INVALID_ROLE = 6402,
}

/**
 * Niveles de prioridad para notificaciones y alertas
 */
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Estados de notificación
 */
export enum NotificationStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  DISMISSED = 'DISMISSED',
}

/**
 * Tipos de eventos de cuidado
 */
export enum CareEventType {
  MEDICATION = 'MEDICATION',
  FALL = 'FALL',
  POSTURAL_CHANGE = 'POSTURAL_CHANGE',
  NUTRITION = 'NUTRITION',
  INCONTINENCE = 'INCONTINENCE',
  RESTRAINT = 'RESTRAINT',
  ASSESSMENT = 'ASSESSMENT',
}

/**
 * Estados de sincronización
 */
export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  CONFLICT = 'CONFLICT',
}

/**
 * Estados de conexión
 */
export enum ConnectionStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

/**
 * Temas de interfaz
 */
export enum Theme {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
}

/**
 * Roles de usuario
 */
export enum UserRole {
  CAREGIVER = 'CAREGIVER',
  ADMIN = 'ADMIN',
  HEALTHCARE_PROFESSIONAL = 'HEALTHCARE_PROFESSIONAL',
}

/**
 * Estados de medicación
 */
export enum MedicationEventStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  OMITTED = 'OMITTED',
  LATE = 'LATE',
}

/**
 * Frecuencia de programación
 */
export enum ScheduleFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  AS_NEEDED = 'AS_NEEDED',
}

/**
 * Tipos de restricción
 */
export enum RestraintType {
  CHEMICAL = 'CHEMICAL',
  MECHANICAL = 'MECHANICAL',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
}

/**
 * Estados de restricción
 */
export enum RestraintStatus {
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

/**
 * Grados de úlcera por presión
 */
export enum UlcerGrade {
  I = 'I',
  II = 'II',
  III = 'III',
  IV = 'IV',
}

/**
 * Estados de curación de úlcera
 */
export enum HealingStatus {
  NEW = 'NEW',
  IMPROVING = 'IMPROVING',
  STABLE = 'STABLE',
  WORSENING = 'WORSENING',
}

/**
 * Posiciones posturales
 */
export enum Position {
  SUPINE = 'SUPINE',
  LEFT_LATERAL = 'LEFT_LATERAL',
  RIGHT_LATERAL = 'RIGHT_LATERAL',
  PRONE = 'PRONE',
  SEATED = 'SEATED',
}

/**
 * Tipos de comida
 */
export enum MealType {
  BREAKFAST = 'BREAKFAST',
  MID_MORNING = 'MID_MORNING',
  LUNCH = 'LUNCH',
  SNACK = 'SNACK',
  DINNER = 'DINNER',
}

/**
 * Tipos de evento de nutrición
 */
export enum NutritionEventType {
  MEAL = 'MEAL',
  HYDRATION = 'HYDRATION',
}

/**
 * Tipos de evento de incontinencia
 */
export enum IncontinenceEventType {
  BATHROOM_VISIT = 'BATHROOM_VISIT',
  EPISODE = 'EPISODE',
}

/**
 * Severidad de episodio de incontinencia
 */
export enum IncontinenceSeverity {
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  MAJOR = 'MAJOR',
}

/**
 * Tipos de factor de riesgo
 */
export enum RiskFactorType {
  SEDATIVES = 'SEDATIVES',
  COGNITIVE_IMPAIRMENT = 'COGNITIVE_IMPAIRMENT',
  VISION_PROBLEMS = 'VISION_PROBLEMS',
  MOBILITY_ISSUES = 'MOBILITY_ISSUES',
}

/**
 * Niveles de severidad
 */
export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * Estados de evaluación de riesgo
 */
export enum RiskChecklistStatus {
  ADEQUATE = 'ADEQUATE',
  INADEQUATE = 'INADEQUATE',
  SAFE = 'SAFE',
  HAZARDOUS = 'HAZARDOUS',
  APPROPRIATE = 'APPROPRIATE',
  INAPPROPRIATE = 'INAPPROPRIATE',
}

/**
 * Tipos de notificación
 */
export enum NotificationType {
  MEDICATION = 'MEDICATION',
  POSTURAL_CHANGE = 'POSTURAL_CHANGE',
  HYDRATION = 'HYDRATION',
  BATHROOM = 'BATHROOM',
  RISK_ALERT = 'RISK_ALERT',
}

/**
 * Estados de resolución de conflictos
 */
export enum ConflictResolution {
  PENDING = 'PENDING',
  LOCAL_WINS = 'LOCAL_WINS',
  REMOTE_WINS = 'REMOTE_WINS',
  MANUAL = 'MANUAL',
}
