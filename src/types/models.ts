import {
  CareEventType,
  ConflictResolution,
  ConnectionStatus,
  HealingStatus,
  IncontinenceEventType,
  IncontinenceSeverity,
  MealType,
  MedicationEventStatus,
  NotificationStatus,
  NotificationType,
  NutritionEventType,
  Position,
  Priority,
  RestraintStatus,
  RestraintType,
  RiskChecklistStatus,
  RiskFactorType,
  ScheduleFrequency,
  Severity,
  SyncStatus,
  Theme,
  UlcerGrade,
  UserRole,
} from './enums';

/**
 * Programación de eventos
 */
export interface Schedule {
  times: Date[];
  frequency: ScheduleFrequency;
  daysOfWeek?: number[]; // 0-6 para semanal
}

/**
 * Factor de riesgo del paciente
 */
export interface RiskFactor {
  type: RiskFactorType;
  severity: Severity;
  notes: string;
  assessedAt: Date;
}

/**
 * Preferencias del paciente
 */
export interface PatientPreferences {
  dietaryRestrictions?: string[];
  allergies?: string[];
  notes?: string;
}

/**
 * Paciente
 */
export interface Patient {
  id: string;
  name: string;
  dateOfBirth: Date;
  riskFactors: RiskFactor[];
  medications: Medication[];
  careHistory: CareEvent[];
  preferences: PatientPreferences;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Medicamento
 */
export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  purpose: string;
  schedule: Schedule;
  stockLevel: number;
  expirationDate: Date;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Evento de medicamento
 */
export interface MedicationEvent {
  id: string;
  medicationId: string;
  patientId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: MedicationEventStatus;
  justification?: string;
  withinAdherenceWindow: boolean;
  createdAt: Date;
}

/**
 * Preferencias de notificación
 */
export interface NotificationPreferences {
  enableSound: boolean;
  enableVibration: boolean;
  enablePushNotifications: boolean;
  quietHoursStart?: Date;
  quietHoursEnd?: Date;
  priorityFilter: 'ALL' | 'HIGH_ONLY' | 'CRITICAL_ONLY';
}

/**
 * Notificación
 */
export interface Notification {
  id: string;
  patientId: string;
  type: NotificationType;
  priority: Priority;
  message: string;
  scheduledTime: Date;
  isDualAlert: boolean;
  status: NotificationStatus;
  reminderSent: boolean;
  createdAt: Date;
}

/**
 * Incidente de caída
 */
export interface FallIncident {
  id: string;
  patientId: string;
  occurredAt: Date;
  timeOnFloor: number; // minutos
  location: string;
  circumstances: string;
  injuries: string[];
  reportedBy: string;
  createdAt: Date;
}

/**
 * Lista de verificación de riesgos
 */
export interface RiskChecklist {
  id: string;
  patientId: string;
  checkDate: Date;
  lighting: RiskChecklistStatus;
  flooring: RiskChecklistStatus;
  footwear: RiskChecklistStatus;
  notes: string;
  completedBy: string;
  createdAt: Date;
}

/**
 * Fotografía
 */
export interface Photo {
  id: string;
  url: string;
  capturedAt: Date;
  notes: string;
}

/**
 * Úlcera por presión
 */
export interface PressureUlcer {
  id: string;
  patientId: string;
  grade: UlcerGrade;
  location: string;
  size: {
    length: number; // cm
    width: number; // cm
    depth?: number; // cm
  };
  photos: Photo[];
  treatment: string;
  assessedAt: Date;
  healingStatus: HealingStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cambio postural
 */
export interface PosturalChange {
  id: string;
  patientId: string;
  position: Position;
  bedElevation?: number; // grados, máx 30
  performedAt: Date;
  performedBy: string;
  notes: string;
  createdAt: Date;
}

/**
 * Evento de nutrición
 */
export interface NutritionEvent {
  id: string;
  patientId: string;
  type: NutritionEventType;
  mealType?: MealType;
  foodItems?: string[];
  fluidGlasses?: number;
  occurredAt: Date;
  notes: string;
  createdAt: Date;
}

/**
 * Comida planificada
 */
export interface PlannedMeal {
  mealType: MealType;
  time: Date;
  recommendedFoods: string[];
  notes: string;
}

/**
 * Plan de comidas
 */
export interface MealPlan {
  id: string;
  patientId: string;
  meals: PlannedMeal[];
  seggCompliant: boolean;
  createdAt: Date;
}

/**
 * Evento de incontinencia
 */
export interface IncontinenceEvent {
  id: string;
  patientId: string;
  type: IncontinenceEventType;
  success?: boolean; // Para visitas al baño
  severity?: IncontinenceSeverity; // Para episodios
  occurredAt: Date;
  notes: string;
  createdAt: Date;
}

/**
 * Restricción
 */
export interface Restraint {
  id: string;
  patientId: string;
  type: RestraintType;
  specificType: string;
  justification: string;
  alternatives: string[];
  authorizedBy: string;
  startTime: Date;
  endTime?: Date;
  reviewSchedule: Date[];
  status: RestraintStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Evento de cuidado (tipo base)
 */
export interface CareEvent {
  id: string;
  patientId: string;
  eventType: CareEventType;
  timestamp: Date;
  performedBy: string;
  syncStatus: SyncStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Preferencias de usuario
 */
export interface UserPreferences {
  theme: Theme;
  language: 'es';
  notificationSettings: NotificationPreferences;
  autoLogoutMinutes: number;
}

/**
 * Usuario/Cuidador
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  patients: string[]; // IDs de pacientes asignados
  preferences: UserPreferences;
  lastLogin: Date;
  createdAt: Date;
}

/**
 * Conflicto de sincronización
 */
export interface Conflict {
  id: string;
  eventId: string;
  localVersion: CareEvent;
  remoteVersion: CareEvent;
  resolvedVersion?: CareEvent;
  resolution: ConflictResolution;
  resolvedAt?: Date;
}

/**
 * Metadatos de sincronización
 */
export interface SyncMetadata {
  lastSyncTime: Date;
  pendingEvents: number;
  conflictCount: number;
  connectionStatus: ConnectionStatus;
  lastSuccessfulSync: Date;
}

/**
 * Token de autenticación
 */
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Credenciales de usuario
 */
export interface Credentials {
  email: string;
  password: string;
}

/**
 * Estado de sesión
 */
export interface SessionStatus {
  isValid: boolean;
  expiresAt?: Date;
  userId?: string;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errorCode?: number;
  message?: string;
}

/**
 * Hoja de medicamentos
 */
export interface MedicationSheet {
  patientId: string;
  medications: Medication[];
  generatedAt: Date;
}

/**
 * Confirmación de administración
 */
export interface Confirmation {
  medicationEventId: string;
  confirmedAt: Date;
  withinWindow: boolean;
}

/**
 * Puntuación de riesgo
 */
export interface RiskScore {
  total: number;
  factors: Array<{
    type: RiskFactorType;
    score: number;
  }>;
  level: Severity;
}

/**
 * Alerta de riesgo
 */
export interface RiskAlert {
  id: string;
  patientId: string;
  riskType: RiskFactorType;
  severity: Severity;
  message: string;
  createdAt: Date;
}

/**
 * Estado de hidratación
 */
export interface HydrationStatus {
  patientId: string;
  date: Date;
  targetGlasses: number;
  currentGlasses: number;
  percentage: number;
}

/**
 * Análisis de patrones
 */
export interface PatternAnalysis {
  patientId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  totalEvents: number;
  averagePerDay: number;
  trends: string[];
}

/**
 * Alerta de stock
 */
export interface StockAlert {
  medicationId: string;
  medicationName: string;
  currentStock: number;
  threshold: number;
  message: string;
}

/**
 * Alerta de caducidad
 */
export interface ExpirationAlert {
  medicationId: string;
  medicationName: string;
  expirationDate: Date;
  daysUntilExpiration: number;
  message: string;
}

/**
 * Punto SIGRE
 */
export interface SIGREPoint {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number; // km desde ubicación del usuario
}

/**
 * Estrategia alternativa
 */
export interface Strategy {
  id: string;
  category: 'DISTRACTION' | 'COMMUNICATION' | 'ENVIRONMENTAL';
  title: string;
  description: string;
  examples: string[];
}

/**
 * Contexto de cuidado
 */
export interface CareContext {
  patientId: string;
  situation: string;
  currentRestraints?: Restraint[];
  riskFactors?: RiskFactor[];
  timestamp?: Date;
}

/**
 * Formulario de justificación
 */
export interface JustificationForm {
  restraintId: string;
  justification: string;
  alternatives: string[];
  authorizedBy: string;
  timestamp: Date;
}

/**
 * Reporte de sincronización
 */
export interface SyncReport {
  syncedEvents: number;
  failedEvents: number;
  conflicts: number;
  timestamp: Date;
}

/**
 * Ubicación geográfica
 */
export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Actualización de medicamento
 */
export interface MedicationUpdate {
  medicationId: string;
  field: keyof Medication;
  value: unknown;
}

/**
 * Detalles de medicamento
 */
export interface MedicationDetails {
  name: string;
  dosage: string;
  purpose: string;
  schedule: Schedule;
  stockLevel: number;
  expirationDate: Date;
}

/**
 * Rango de fechas
 */
export interface DateRange {
  start: Date;
  end: Date;
}
