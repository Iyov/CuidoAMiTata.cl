# Documento de Diseño - CuidoAMiTata

## Visión General

CuidoAMiTata es una aplicación móvil de gestión de cuidados geriátricos que implementa un enfoque basado en evidencia siguiendo las directrices de la Sociedad Española de Geriatría y Gerontología (SEGG). El sistema está diseñado con arquitectura modular para facilitar mantenimiento y extensibilidad, priorizando la experiencia móvil y la accesibilidad.

### Objetivos de Diseño

1. **Basado en Evidencia**: Implementar prácticas clínicas validadas por SEGG
2. **Usabilidad**: Interfaz intuitiva para cuidadores con diferentes niveles técnicos
3. **Confiabilidad**: Sistema de notificaciones robusto con alertas duales
4. **Trazabilidad**: Registro completo con marcas temporales para auditoría
5. **Accesibilidad**: Diseño responsivo con soporte de modo oscuro por defecto
6. **Seguridad**: Protección de datos médicos sensibles con cifrado

### Principios Arquitectónicos

- Separación de responsabilidades entre módulos de cuidado
- Arquitectura orientada a eventos para notificaciones
- Almacenamiento local con sincronización en la nube
- Diseño offline-first para disponibilidad continua
- Validación de datos en múltiples capas

## Arquitectura

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                    Capa de Presentación                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   UI React   │  │  Navegación  │  │   Temas      │  │
│  │  Components  │  │   Router     │  │ (Dark/Light) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   Capa de Lógica de Negocio              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Medication   │  │ Fall         │  │ Skin         │  │
│  │ Manager      │  │ Prevention   │  │ Integrity    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Nutrition    │  │ Polypharmacy │  │ Ethical      │  │
│  │ Manager      │  │ Manager      │  │ Care         │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                    Capa de Servicios                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Notification │  │ Data Sync    │  │ Export       │  │
│  │ Service      │  │ Service      │  │ Service      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth         │  │ Storage      │  │ Validation   │  │
│  │ Service      │  │ Service      │  │ Service      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                     Capa de Datos                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ IndexedDB    │  │ LocalStorage │  │ Cloud Sync   │  │
│  │ (Offline)    │  │ (Preferences)│  │ (Backend)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

- **Frontend**: React Native / React (para web y móvil)
- **Estado**: Redux o Context API para gestión de estado global
- **Almacenamiento Local**: IndexedDB para datos estructurados, LocalStorage para preferencias
- **Notificaciones**: Web Push API / React Native Push Notifications
- **Backend**: API RESTful (Node.js/Express o similar)
- **Base de Datos**: PostgreSQL para datos persistentes en la nube
- **Autenticación**: JWT con refresh tokens
- **Cifrado**: AES-256 para datos en reposo, TLS 1.3 para datos en tránsito


## Componentes e Interfaces

### 1. Medication Manager (Gestor de Medicamentos)

**Responsabilidad**: Gestionar programación, notificaciones y registro de administración de medicamentos.

**Interfaz Pública**:
```typescript
interface MedicationManager {
  scheduleMedication(medication: Medication, schedule: Schedule): Result<void>
  confirmAdministration(medicationId: string, timestamp: Date): Result<Confirmation>
  omitDose(medicationId: string, justification: string, timestamp: Date): Result<void>
  getMedicationSheet(): MedicationSheet
  checkAdherenceWindow(scheduledTime: Date, actualTime: Date): boolean
}
```

**Comportamiento Clave**:
- Emite alertas duales (audio + visual) en horarios programados
- Valida ventana de adherencia de 3 horas (±1.5 horas del horario programado)
- Requiere justificación obligatoria para omisiones
- Registra todas las acciones con marcas temporales

### 2. Notification Service (Servicio de Notificaciones)

**Responsabilidad**: Gestionar emisión y programación de notificaciones con alertas duales.

**Interfaz Pública**:
```typescript
interface NotificationService {
  scheduleNotification(notification: Notification): Result<string>
  cancelNotification(notificationId: string): Result<void>
  emitDualAlert(message: string, priority: Priority): Result<void>
  setReminderIfUnattended(notificationId: string, delayMinutes: number): Result<void>
  getUserPreferences(): NotificationPreferences
}
```

**Comportamiento Clave**:
- Alertas duales combinan sonido y vibración con notificación visual
- Priorización automática de alertas críticas
- Recordatorios automáticos después de 15 minutos sin atención
- Respeta preferencias de usuario por tipo de evento

### 3. Fall Prevention Manager (Gestor de Prevención de Caídas)

**Responsabilidad**: Gestionar evaluación de riesgos y registro de incidentes de caídas.

**Interfaz Pública**:
```typescript
interface FallPreventionManager {
  submitDailyChecklist(checklist: RiskChecklist): Result<void>
  recordFallIncident(incident: FallIncident): Result<void>
  getRiskAlerts(patient: Patient): RiskAlert[]
  calculateRiskScore(patient: Patient): RiskScore
}
```

**Comportamiento Clave**:
- Lista de verificación diaria: iluminación, suelos, calzado
- Registro obligatorio de "tiempo en el suelo" en incidentes
- Alertas automáticas basadas en factores de riesgo (sedantes, deterioro cognitivo, problemas de visión)
- Cálculo de puntuación de riesgo agregada

### 4. Skin Integrity Manager (Gestor de Integridad de Piel)

**Responsabilidad**: Gestionar cambios posturales y monitoreo de úlceras por presión.

**Interfaz Pública**:
```typescript
interface SkinIntegrityManager {
  schedulePosturalChanges(daySchedule: Schedule, nightSchedule: Schedule): Result<void>
  recordPosturalChange(timestamp: Date, position: Position): Result<void>
  recordBedElevation(degrees: number): Result<ValidationResult>
  recordPressureUlcer(ulcer: PressureUlcer, photo: Photo): Result<void>
  classifyUlcerGrade(characteristics: UlcerCharacteristics): UlcerGrade
}
```

**Comportamiento Clave**:
- Notificaciones cada 2 horas durante el día (06:00-22:00)
- 3 notificaciones durante la noche (22:00-06:00)
- Validación de elevación de cama máxima 30 grados
- Clasificación UPP en grados I-IV
- Carga de fotografías con marca temporal para telemonitorización


### 5. Nutrition Manager (Gestor de Nutrición)

**Responsabilidad**: Gestionar hidratación y planificación dietética según directrices SEGG.

**Interfaz Pública**:
```typescript
interface NutritionManager {
  scheduleHydrationReminders(targetGlasses: number): Result<void>
  recordFluidIntake(glasses: number, timestamp: Date): Result<void>
  getDailyHydrationStatus(): HydrationStatus
  generateSEGGMealPlan(): MealPlan
  recordMealIntake(meal: Meal, timestamp: Date): Result<void>
}
```

**Comportamiento Clave**:
- Recordatorios activos para 6-8 vasos diarios
- Plan dietético SEGG: pescado, aceite de oliva, yogur
- Estructura de 5 comidas diarias
- Contador en tiempo real de ingesta de líquidos
- Registro con marca temporal de cada ingesta

### 6. Incontinence Manager (Gestor de Incontinencia)

**Responsabilidad**: Gestionar programación de visitas al baño y registro de episodios.

**Interfaz Pública**:
```typescript
interface IncontinenceManager {
  scheduleBathroomReminders(intervalHours: number): Result<void>
  recordBathroomVisit(timestamp: Date): Result<void>
  recordIncontinenceEpisode(episode: IncontinenceEpisode): Result<void>
  analyzePatterns(dateRange: DateRange): PatternAnalysis
}
```

**Comportamiento Clave**:
- Recordatorios cada 2-3 horas
- Registro con marca temporal de visitas
- Registro de episodios con marca temporal
- Análisis de patrones para identificar tendencias

### 7. Polypharmacy Manager (Gestor de Polifarmacia)

**Responsabilidad**: Gestionar hoja de medicamentos, stock y disposición segura.

**Interfaz Pública**:
```typescript
interface PolypharmacyManager {
  addMedication(medication: MedicationDetails): Result<void>
  updateMedicationSheet(updates: MedicationUpdate[]): Result<void>
  exportToPDF(): Result<PDFDocument>
  checkStockLevels(): StockAlert[]
  checkExpirationDates(): ExpirationAlert[]
  findNearestSIGREPoint(location: Location): SIGREPoint[]
}
```

**Comportamiento Clave**:
- Hoja dinámica con nombre, dosis, propósito
- Exportación PDF para servicios de emergencia
- Alertas de stock bajo y caducidad próxima
- Mapa de puntos SIGRE para disposición
- Justificación obligatoria para omisiones

### 8. Ethical Care Module (Módulo de Cuidado Ético)

**Responsabilidad**: Prevenir restricciones inapropiadas y promover alternativas éticas.

**Interfaz Pública**:
```typescript
interface EthicalCareModule {
  validateRestraint(restraint: Restraint): ValidationResult
  classifyRestraint(restraint: Restraint): RestraintType
  getAlternativeStrategies(situation: CareContext): Strategy[]
  requireJustification(restraint: Restraint): JustificationForm
}
```

**Comportamiento Clave**:
- Bloqueo duro para restricciones químicas (sedantes para manejo conductual)
- Clasificación de barandillas como restricción mecánica
- Panel de estrategias alternativas: distracción, comunicación, modificación ambiental
- Justificación documentada obligatoria para cualquier restricción


### 9. Data Sync Service (Servicio de Sincronización)

**Responsabilidad**: Gestionar sincronización entre almacenamiento local y nube.

**Interfaz Pública**:
```typescript
interface DataSyncService {
  syncPendingEvents(): Result<SyncReport>
  resolveConflicts(conflicts: Conflict[]): Result<void>
  getConnectionStatus(): ConnectionStatus
  enableOfflineMode(): Result<void>
  queueEventForSync(event: CareEvent): Result<void>
}
```

**Comportamiento Clave**:
- Almacenamiento local de eventos cuando offline
- Sincronización automática al restablecer conexión
- Resolución de conflictos priorizando registro más reciente
- Indicador visual de estado de conexión y sincronización

### 10. Storage Service (Servicio de Almacenamiento)

**Responsabilidad**: Gestionar persistencia de datos con cifrado.

**Interfaz Pública**:
```typescript
interface StorageService {
  saveEncrypted(key: string, data: any): Result<void>
  loadEncrypted(key: string): Result<any>
  savePreference(key: string, value: any): Result<void>
  loadPreference(key: string): Result<any>
  clearPatientData(patientId: string): Result<void>
}
```

**Comportamiento Clave**:
- Cifrado AES-256 para datos sensibles
- IndexedDB para datos estructurados
- LocalStorage para preferencias de usuario
- Separación de datos por paciente

### 11. Auth Service (Servicio de Autenticación)

**Responsabilidad**: Gestionar autenticación y autorización de usuarios.

**Interfaz Pública**:
```typescript
interface AuthService {
  login(credentials: Credentials): Result<AuthToken>
  logout(): Result<void>
  refreshToken(token: RefreshToken): Result<AuthToken>
  checkSession(): SessionStatus
  enforceAutoLogout(inactivityMinutes: number): Result<void>
}
```

**Comportamiento Clave**:
- Autenticación JWT con refresh tokens
- Cierre de sesión automático después de 15 minutos de inactividad
- Validación de sesión en cada operación sensible
- Tokens cifrados en almacenamiento local

### 12. Validation Service (Servicio de Validación)

**Responsabilidad**: Validar datos de entrada en múltiples capas.

**Interfaz Pública**:
```typescript
interface ValidationService {
  validateMedicationSchedule(schedule: Schedule): ValidationResult
  validateAdherenceWindow(scheduled: Date, actual: Date): boolean
  validateBedElevation(degrees: number): ValidationResult
  validateRequiredField(field: any, fieldName: string): ValidationResult
  validateDateRange(start: Date, end: Date): ValidationResult
}
```

**Comportamiento Clave**:
- Validación de ventana de adherencia (3 horas)
- Validación de elevación de cama (máx 30 grados)
- Validación de campos obligatorios
- Mensajes de error descriptivos en español


## Modelos de Datos

### Patient (Paciente)

```typescript
interface Patient {
  id: string
  name: string
  dateOfBirth: Date
  riskFactors: RiskFactor[]
  medications: Medication[]
  careHistory: CareEvent[]
  preferences: PatientPreferences
  createdAt: Date
  updatedAt: Date
}

interface RiskFactor {
  type: 'SEDATIVES' | 'COGNITIVE_IMPAIRMENT' | 'VISION_PROBLEMS' | 'MOBILITY_ISSUES'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  notes: string
  assessedAt: Date
}
```

### Medication (Medicamento)

```typescript
interface Medication {
  id: string
  patientId: string
  name: string
  dosage: string
  purpose: string
  schedule: Schedule
  stockLevel: number
  expirationDate: Date
  isActive: boolean
  createdAt: Date
}

interface Schedule {
  times: Date[]  // Horarios diarios
  frequency: 'DAILY' | 'WEEKLY' | 'AS_NEEDED'
  daysOfWeek?: number[]  // 0-6 para semanal
}
```

### MedicationEvent (Evento de Medicamento)

```typescript
interface MedicationEvent {
  id: string
  medicationId: string
  patientId: string
  scheduledTime: Date
  actualTime?: Date
  status: 'PENDING' | 'CONFIRMED' | 'OMITTED' | 'LATE'
  justification?: string  // Obligatorio si status === 'OMITTED'
  withinAdherenceWindow: boolean
  createdAt: Date
}
```

### Notification (Notificación)

```typescript
interface Notification {
  id: string
  patientId: string
  type: 'MEDICATION' | 'POSTURAL_CHANGE' | 'HYDRATION' | 'BATHROOM' | 'RISK_ALERT'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  scheduledTime: Date
  isDualAlert: boolean
  status: 'SCHEDULED' | 'SENT' | 'ACKNOWLEDGED' | 'DISMISSED'
  reminderSent: boolean
  createdAt: Date
}
```

### FallIncident (Incidente de Caída)

```typescript
interface FallIncident {
  id: string
  patientId: string
  occurredAt: Date
  timeOnFloor: number  // minutos
  location: string
  circumstances: string
  injuries: string[]
  reportedBy: string
  createdAt: Date
}

interface RiskChecklist {
  id: string
  patientId: string
  checkDate: Date
  lighting: 'ADEQUATE' | 'INADEQUATE'
  flooring: 'SAFE' | 'HAZARDOUS'
  footwear: 'APPROPRIATE' | 'INAPPROPRIATE'
  notes: string
  completedBy: string
  createdAt: Date
}
```

### PressureUlcer (Úlcera por Presión)

```typescript
interface PressureUlcer {
  id: string
  patientId: string
  grade: 'I' | 'II' | 'III' | 'IV'
  location: string
  size: {
    length: number  // cm
    width: number   // cm
    depth?: number  // cm
  }
  photos: Photo[]
  treatment: string
  assessedAt: Date
  healingStatus: 'NEW' | 'IMPROVING' | 'STABLE' | 'WORSENING'
  createdAt: Date
  updatedAt: Date
}

interface Photo {
  id: string
  url: string
  capturedAt: Date
  notes: string
}
```

### PosturalChange (Cambio Postural)

```typescript
interface PosturalChange {
  id: string
  patientId: string
  position: 'SUPINE' | 'LEFT_LATERAL' | 'RIGHT_LATERAL' | 'PRONE' | 'SEATED'
  bedElevation?: number  // grados, máx 30
  performedAt: Date
  performedBy: string
  notes: string
  createdAt: Date
}
```


### NutritionEvent (Evento de Nutrición)

```typescript
interface NutritionEvent {
  id: string
  patientId: string
  type: 'MEAL' | 'HYDRATION'
  mealType?: 'BREAKFAST' | 'MID_MORNING' | 'LUNCH' | 'SNACK' | 'DINNER'
  foodItems?: string[]
  fluidGlasses?: number
  occurredAt: Date
  notes: string
  createdAt: Date
}

interface MealPlan {
  id: string
  patientId: string
  meals: PlannedMeal[]
  seggCompliant: boolean
  createdAt: Date
}

interface PlannedMeal {
  mealType: 'BREAKFAST' | 'MID_MORNING' | 'LUNCH' | 'SNACK' | 'DINNER'
  time: Date
  recommendedFoods: string[]
  notes: string
}
```

### IncontinenceEvent (Evento de Incontinencia)

```typescript
interface IncontinenceEvent {
  id: string
  patientId: string
  type: 'BATHROOM_VISIT' | 'EPISODE'
  success?: boolean  // Para visitas al baño
  severity?: 'MINOR' | 'MODERATE' | 'MAJOR'  // Para episodios
  occurredAt: Date
  notes: string
  createdAt: Date
}
```

### Restraint (Restricción)

```typescript
interface Restraint {
  id: string
  patientId: string
  type: 'CHEMICAL' | 'MECHANICAL' | 'ENVIRONMENTAL'
  specificType: string  // ej: 'SIDE_RAILS', 'SEDATIVE', 'LOCKED_DOOR'
  justification: string  // Obligatorio
  alternatives: string[]  // Estrategias consideradas
  authorizedBy: string
  startTime: Date
  endTime?: Date
  reviewSchedule: Date[]
  status: 'ACTIVE' | 'DISCONTINUED'
  createdAt: Date
  updatedAt: Date
}
```

### CareEvent (Evento de Cuidado - Tipo Base)

```typescript
interface CareEvent {
  id: string
  patientId: string
  eventType: 'MEDICATION' | 'FALL' | 'POSTURAL_CHANGE' | 'NUTRITION' | 
             'INCONTINENCE' | 'RESTRAINT' | 'ASSESSMENT'
  timestamp: Date
  performedBy: string
  syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT'
  metadata: Record<string, any>
  createdAt: Date
}
```

### User (Usuario/Cuidador)

```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'CAREGIVER' | 'ADMIN' | 'HEALTHCARE_PROFESSIONAL'
  patients: string[]  // IDs de pacientes asignados
  preferences: UserPreferences
  lastLogin: Date
  createdAt: Date
}

interface UserPreferences {
  theme: 'DARK' | 'LIGHT'
  language: 'es'
  notificationSettings: NotificationPreferences
  autoLogoutMinutes: number
}

interface NotificationPreferences {
  enableSound: boolean
  enableVibration: boolean
  enablePushNotifications: boolean
  quietHoursStart?: Date
  quietHoursEnd?: Date
  priorityFilter: 'ALL' | 'HIGH_ONLY' | 'CRITICAL_ONLY'
}
```

### SyncMetadata (Metadatos de Sincronización)

```typescript
interface SyncMetadata {
  lastSyncTime: Date
  pendingEvents: number
  conflictCount: number
  connectionStatus: 'ONLINE' | 'OFFLINE'
  lastSuccessfulSync: Date
}

interface Conflict {
  id: string
  eventId: string
  localVersion: CareEvent
  remoteVersion: CareEvent
  resolvedVersion?: CareEvent
  resolution: 'PENDING' | 'LOCAL_WINS' | 'REMOTE_WINS' | 'MANUAL'
  resolvedAt?: Date
}
```


## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe ser verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquina.*

### Propiedad 1: Emisión de alertas duales en horarios programados

*Para cualquier* medicamento programado, cuando llega su hora programada, el sistema debe emitir una alerta dual (audio + visual).

**Valida: Requisitos 1.1**

### Propiedad 2: Registro temporal universal de eventos

*Para cualquier* evento de cuidado (medicación, caída, cambio postural, nutrición, incontinencia, restricción), el sistema debe registrar una marca temporal con fecha y hora exactas.

**Valida: Requisitos 1.2, 1.4, 2.2, 3.6, 4.5, 5.2, 5.3, 9.1**

### Propiedad 3: Validación de ventana de adherencia

*Para cualquier* confirmación de administración de medicamento, el sistema debe validar que ocurra dentro de la ventana de adherencia de 3 horas (±1.5 horas del horario programado).

**Valida: Requisitos 1.3**

### Propiedad 4: Justificación obligatoria para acciones críticas

*Para cualquier* acción crítica (omisión de dosis, registro de restricción), el sistema debe bloquear la operación hasta que se proporcione una justificación documentada.

**Valida: Requisitos 1.5, 6.6, 7.5**

### Propiedad 5: Campo obligatorio de tiempo en el suelo

*Para cualquier* registro de incidente de caída, el sistema debe requerir el campo "tiempo en el suelo" y rechazar registros sin este dato.

**Valida: Requisitos 2.3**

### Propiedad 6: Alertas automáticas por factores de riesgo

*Para cualquier* paciente con factores de riesgo registrados (sedantes, deterioro cognitivo, problemas de visión), el sistema debe mostrar alertas de riesgo elevado de caídas.

**Valida: Requisitos 2.4, 2.5, 2.6**

### Propiedad 7: Programación de cambios posturales diurnos

*Para cualquier* paciente, durante el período diurno (06:00-22:00), el sistema debe programar notificaciones de cambio postural cada 2 horas exactamente.

**Valida: Requisitos 3.1**

### Propiedad 8: Programación de cambios posturales nocturnos

*Para cualquier* paciente, durante el período nocturno (22:00-06:00), el sistema debe programar exactamente 3 notificaciones de cambio postural.

**Valida: Requisitos 3.2**

### Propiedad 9: Validación de elevación de cama

*Para cualquier* registro de elevación de cama, el sistema debe rechazar valores que excedan 30 grados y aceptar valores menores o iguales a 30 grados.

**Valida: Requisitos 3.3**

### Propiedad 10: Estructura de plan de comidas SEGG

*Para cualquier* plan de comidas generado, el sistema debe estructurarlo en exactamente 5 ingestas diarias.

**Valida: Requisitos 4.3**

### Propiedad 11: Actualización de contador de hidratación

*Para cualquier* registro de ingesta de líquidos, el sistema debe incrementar el contador diario de vasos por la cantidad registrada.

**Valida: Requisitos 4.4**

### Propiedad 12: Programación de recordatorios de baño

*Para cualquier* paciente, el sistema debe programar recordatorios de visita al baño con intervalos entre 2 y 3 horas.

**Valida: Requisitos 5.1**

### Propiedad 13: Persistencia de historial de episodios

*Para cualquier* episodio de incontinencia registrado, el sistema debe almacenarlo en el historial y permitir su recuperación para análisis de patrones.

**Valida: Requisitos 5.4**

### Propiedad 14: Exportación PDF de hoja de medicamentos

*Para cualquier* hoja de medicamentos, el sistema debe poder exportarla a formato PDF válido que incluya nombre, dosis y propósito de cada medicamento.

**Valida: Requisitos 6.2**

### Propiedad 15: Alertas de stock bajo

*Para cualquier* medicamento con nivel de stock por debajo del umbral configurado, el sistema debe emitir una notificación de reabastecimiento.

**Valida: Requisitos 6.3**

### Propiedad 16: Alertas de caducidad próxima

*Para cualquier* medicamento cuya fecha de caducidad esté dentro del período de alerta configurado, el sistema debe emitir una alerta de caducidad.

**Valida: Requisitos 6.4**

### Propiedad 17: Bloqueo de restricciones químicas

*Para cualquier* intento de registrar sedantes con propósito de manejo conductual, el sistema debe bloquear la acción y mostrar advertencia de restricción química.

**Valida: Requisitos 7.1**

### Propiedad 18: Clasificación automática de restricciones mecánicas

*Para cualquier* registro de barandillas laterales, el sistema debe clasificarlas automáticamente como restricción mecánica.

**Valida: Requisitos 7.2**

### Propiedad 19: Panel de estrategias alternativas

*Para cualquier* restricción identificada, el sistema debe mostrar un panel con estrategias alternativas antes de permitir el registro.

**Valida: Requisitos 7.3**

### Propiedad 20: Contenido en español

*Para cualquier* elemento de interfaz de usuario (botones, etiquetas, mensajes, notificaciones), el texto debe estar en español.

**Valida: Requisitos 8.3**

### Propiedad 21: Persistencia de preferencia de tema

*Para cualquier* cambio de modo de visualización (claro/oscuro), el sistema debe persistir la preferencia y restaurarla en la próxima sesión.

**Valida: Requisitos 8.5**

### Propiedad 22: Orden cronológico del historial

*Para cualquier* consulta de historial de eventos, el sistema debe devolver los eventos ordenados cronológicamente (más reciente primero o más antiguo primero según configuración).

**Valida: Requisitos 9.2**

### Propiedad 23: Preservación de timestamps en exportación

*Para cualquier* exportación de datos, el sistema debe incluir todas las marcas temporales de los eventos exportados en el formato de salida.

**Valida: Requisitos 9.3**

### Propiedad 24: Inmutabilidad de registros históricos

*Para cualquier* registro histórico (más de 24 horas de antigüedad), el sistema debe impedir su modificación o eliminación.

**Valida: Requisitos 9.4**

### Propiedad 25: Filtrado de registros

*Para cualquier* filtro aplicado (tipo de evento, rango de fechas), el sistema debe devolver solo registros que cumplan todos los criterios del filtro.

**Valida: Requisitos 9.5**

### Propiedad 26: Aislamiento de datos por paciente

*Para cualquier* paciente seleccionado, el sistema debe mostrar solo datos, alertas y notificaciones que pertenezcan a ese paciente específico.

**Valida: Requisitos 10.2, 10.5**

### Propiedad 27: Indicadores visuales de alertas pendientes

*Para cualquier* paciente con alertas pendientes, el sistema debe mostrar un indicador visual en su perfil.

**Valida: Requisitos 10.3**

### Propiedad 28: Precisión temporal de notificaciones

*Para cualquier* notificación programada, el sistema debe emitirla dentro de un margen de ±30 segundos del momento programado.

**Valida: Requisitos 11.1**

### Propiedad 29: Alertas duales para notificaciones críticas

*Para cualquier* notificación con prioridad CRITICAL, el sistema debe usar alerta dual (audio + visual).

**Valida: Requisitos 11.2**

### Propiedad 30: Priorización de alertas múltiples

*Para cualquier* conjunto de alertas pendientes, el sistema debe ordenarlas por nivel de urgencia (CRITICAL > HIGH > MEDIUM > LOW).

**Valida: Requisitos 11.3**

### Propiedad 31: Recordatorios por notificaciones desatendidas

*Para cualquier* notificación no atendida después de 15 minutos, el sistema debe emitir un recordatorio automático.

**Valida: Requisitos 11.5**

### Propiedad 32: Cifrado de datos sensibles

*Para cualquier* dato sensible almacenado (información médica, datos personales), el sistema debe cifrarlo usando AES-256 antes de persistirlo.

**Valida: Requisitos 12.3**

### Propiedad 33: Confirmación para exportación de datos

*Para cualquier* operación de exportación de datos, el sistema debe requerir confirmación explícita del usuario antes de proceder.

**Valida: Requisitos 12.5**

### Propiedad 34: Almacenamiento local de eventos offline

*Para cualquier* evento registrado mientras el sistema está offline, el sistema debe almacenarlo localmente y marcarlo como pendiente de sincronización.

**Valida: Requisitos 13.2**

### Propiedad 35: Sincronización automática al reconectar

*Para cualquier* evento pendiente de sincronización, cuando se restablece la conexión, el sistema debe sincronizarlo automáticamente con el backend.

**Valida: Requisitos 13.3**

### Propiedad 36: Resolución de conflictos por timestamp

*Para cualquier* conflicto de sincronización entre versión local y remota del mismo evento, el sistema debe priorizar la versión con timestamp más reciente.

**Valida: Requisitos 13.4**


## Manejo de Errores

### Estrategia General

El sistema implementa manejo de errores en múltiples capas con mensajes descriptivos en español y recuperación elegante cuando es posible.

### Categorías de Errores

#### 1. Errores de Validación

**Ejemplos**:
- Ventana de adherencia excedida
- Elevación de cama > 30 grados
- Campos obligatorios faltantes (justificación, tiempo en el suelo)
- Formato de datos inválido

**Manejo**:
- Mostrar mensaje de error descriptivo en español
- Resaltar campo problemático en la UI
- Prevenir envío del formulario hasta corrección
- Registrar intento de validación fallido para auditoría

#### 2. Errores de Conectividad

**Ejemplos**:
- Pérdida de conexión a internet
- Timeout de sincronización
- Fallo de autenticación por token expirado

**Manejo**:
- Cambiar automáticamente a modo offline
- Mostrar indicador visual de estado offline
- Almacenar eventos localmente
- Reintentar sincronización automáticamente al reconectar
- Refrescar token automáticamente si es posible

#### 3. Errores de Negocio

**Ejemplos**:
- Intento de registrar restricción química
- Intento de modificar registro histórico
- Intento de omitir dosis sin justificación

**Manejo**:
- Bloquear operación completamente
- Mostrar mensaje explicativo con alternativas
- Para restricciones químicas: mostrar panel de estrategias alternativas
- Registrar intento bloqueado para auditoría

#### 4. Errores de Sistema

**Ejemplos**:
- Fallo de cifrado/descifrado
- Error de almacenamiento (cuota excedida)
- Fallo de notificación push
- Error de exportación PDF

**Manejo**:
- Registrar error detallado en logs
- Mostrar mensaje genérico al usuario
- Ofrecer acción alternativa cuando sea posible
- Para notificaciones: reintentar hasta 3 veces
- Para exportación: ofrecer formato alternativo

#### 5. Conflictos de Sincronización

**Ejemplos**:
- Mismo evento modificado offline y online
- Eventos con timestamps idénticos
- Datos inconsistentes entre local y remoto

**Manejo**:
- Aplicar estrategia de resolución automática (timestamp más reciente)
- Registrar conflicto y resolución para auditoría
- Notificar al usuario si la resolución afecta datos críticos
- Mantener versión descartada en logs por 30 días

### Códigos de Error

```typescript
enum ErrorCode {
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
  SYNC_DATA_INCONSISTENT = 5003
}
```

### Mensajes de Error en Español

Todos los mensajes de error deben ser:
- Claros y descriptivos
- En español
- Orientados a la acción (qué hacer para resolver)
- Apropiados para cuidadores no técnicos

**Ejemplos**:
- "La administración debe ocurrir dentro de 3 horas del horario programado"
- "La elevación de la cama no puede exceder 30 grados"
- "Debe proporcionar una justificación para omitir esta dosis"
- "No se pueden usar sedantes para manejo conductual. Consulte las estrategias alternativas."


## Estrategia de Pruebas

### Enfoque Dual de Pruebas

El sistema requiere tanto pruebas unitarias como pruebas basadas en propiedades para cobertura completa:

- **Pruebas unitarias**: Verifican ejemplos específicos, casos límite y condiciones de error
- **Pruebas de propiedades**: Verifican propiedades universales a través de todos los inputs posibles

Ambos tipos son complementarios y necesarios. Las pruebas unitarias capturan bugs concretos, mientras que las pruebas de propiedades verifican corrección general.

### Configuración de Pruebas Basadas en Propiedades

**Biblioteca recomendada**: fast-check (para TypeScript/JavaScript)

**Configuración**:
- Mínimo 100 iteraciones por prueba de propiedad
- Cada prueba debe referenciar su propiedad del documento de diseño
- Formato de etiqueta: `Feature: cuido-a-mi-tata, Property {número}: {texto de propiedad}`

### Pruebas Unitarias

#### Áreas de Enfoque

1. **Validación de Ventana de Adherencia**
   - Caso exacto: confirmación en horario programado
   - Caso límite: confirmación a +1.5 horas (dentro de ventana)
   - Caso límite: confirmación a -1.5 horas (dentro de ventana)
   - Caso de error: confirmación a +2 horas (fuera de ventana)

2. **Validación de Elevación de Cama**
   - Caso válido: 30 grados (límite superior)
   - Caso válido: 0 grados
   - Caso inválido: 31 grados
   - Caso inválido: valores negativos

3. **Programación de Cambios Posturales**
   - Verificar 8 notificaciones diurnas (cada 2 horas de 06:00 a 22:00)
   - Verificar 3 notificaciones nocturnas (22:00 a 06:00)
   - Verificar horarios exactos

4. **Bloqueo de Restricciones Químicas**
   - Intento de registrar sedante para manejo conductual → bloqueado
   - Registro de sedante para indicación médica válida → permitido
   - Verificar mensaje de advertencia mostrado

5. **Clasificación de UPP**
   - Verificar clasificación correcta para cada grado (I-IV)
   - Verificar campos requeridos por grado

6. **Exportación PDF**
   - Exportar hoja de medicamentos vacía
   - Exportar hoja con 1 medicamento
   - Exportar hoja con múltiples medicamentos
   - Verificar formato PDF válido

7. **Modo Offline**
   - Registrar evento offline → almacenado localmente
   - Reconectar → evento sincronizado
   - Verificar indicador de estado

### Pruebas Basadas en Propiedades

#### Propiedad 1: Emisión de alertas duales
```typescript
// Feature: cuido-a-mi-tata, Property 1: Emisión de alertas duales en horarios programados
fc.assert(
  fc.property(
    medicationScheduleArbitrary,
    (schedule) => {
      const alerts = scheduleAlerts(schedule);
      return alerts.every(alert => 
        alert.isDualAlert === true &&
        alert.scheduledTime.equals(schedule.time)
      );
    }
  ),
  { numRuns: 100 }
);
```

#### Propiedad 2: Registro temporal universal
```typescript
// Feature: cuido-a-mi-tata, Property 2: Registro temporal universal de eventos
fc.assert(
  fc.property(
    careEventArbitrary,
    (event) => {
      const recorded = recordCareEvent(event);
      return recorded.timestamp !== undefined &&
             recorded.timestamp instanceof Date &&
             !isNaN(recorded.timestamp.getTime());
    }
  ),
  { numRuns: 100 }
);
```

#### Propiedad 3: Validación de ventana de adherencia
```typescript
// Feature: cuido-a-mi-tata, Property 3: Validación de ventana de adherencia
fc.assert(
  fc.property(
    fc.date(),
    fc.integer({ min: -180, max: 180 }), // minutos de diferencia
    (scheduledTime, minutesDiff) => {
      const actualTime = new Date(scheduledTime.getTime() + minutesDiff * 60000);
      const isValid = checkAdherenceWindow(scheduledTime, actualTime);
      const expectedValid = Math.abs(minutesDiff) <= 90; // 1.5 horas = 90 minutos
      return isValid === expectedValid;
    }
  ),
  { numRuns: 100 }
);
```

#### Propiedad 4: Justificación obligatoria
```typescript
// Feature: cuido-a-mi-tata, Property 4: Justificación obligatoria para acciones críticas
fc.assert(
  fc.property(
    medicationIdArbitrary,
    fc.option(fc.string({ minLength: 10 }), { nil: undefined }),
    (medicationId, justification) => {
      const result = omitDose(medicationId, justification);
      if (justification === undefined || justification.trim() === '') {
        return result.isError() && result.error.code === ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED;
      } else {
        return result.isOk();
      }
    }
  ),
  { numRuns: 100 }
);
```

#### Propiedad 9: Validación de elevación de cama
```typescript
// Feature: cuido-a-mi-tata, Property 9: Validación de elevación de cama
fc.assert(
  fc.property(
    fc.integer({ min: -10, max: 50 }),
    (degrees) => {
      const result = validateBedElevation(degrees);
      if (degrees <= 30 && degrees >= 0) {
        return result.isValid === true;
      } else {
        return result.isValid === false &&
               result.errorCode === ErrorCode.VALIDATION_BED_ELEVATION;
      }
    }
  ),
  { numRuns: 100 }
);
```

#### Propiedad 20: Contenido en español
```typescript
// Feature: cuido-a-mi-tata, Property 20: Contenido en español
fc.assert(
  fc.property(
    uiElementArbitrary,
    (element) => {
      const text = extractText(element);
      return isSpanish(text); // Función que verifica idioma español
    }
  ),
  { numRuns: 100 }
);
```

#### Propiedad 22: Orden cronológico del historial
```typescript
// Feature: cuido-a-mi-tata, Property 22: Orden cronológico del historial
fc.assert(
  fc.property(
    fc.array(careEventArbitrary, { minLength: 2, maxLength: 50 }),
    (events) => {
      // Registrar eventos en orden aleatorio
      events.forEach(e => recordCareEvent(e));
      
      const history = getHistory();
      
      // Verificar que están ordenados cronológicamente
      for (let i = 1; i < history.length; i++) {
        if (history[i].timestamp < history[i-1].timestamp) {
          return false;
        }
      }
      return true;
    }
  ),
  { numRuns: 100 }
);
```

#### Propiedad 26: Aislamiento de datos por paciente
```typescript
// Feature: cuido-a-mi-tata, Property 26: Aislamiento de datos por paciente
fc.assert(
  fc.property(
    fc.array(patientWithEventsArbitrary, { minLength: 2, maxLength: 5 }),
    (patients) => {
      // Registrar eventos para múltiples pacientes
      patients.forEach(p => {
        p.events.forEach(e => recordCareEvent(e));
      });
      
      // Para cada paciente, verificar que solo ve sus datos
      return patients.every(patient => {
        selectPatient(patient.id);
        const visibleEvents = getVisibleEvents();
        return visibleEvents.every(e => e.patientId === patient.id);
      });
    }
  ),
  { numRuns: 100 }
);
```

#### Propiedad 36: Resolución de conflictos por timestamp
```typescript
// Feature: cuido-a-mi-tata, Property 36: Resolución de conflictos por timestamp
fc.assert(
  fc.property(
    careEventArbitrary,
    fc.date(),
    fc.date(),
    (baseEvent, localTimestamp, remoteTimestamp) => {
      const localVersion = { ...baseEvent, timestamp: localTimestamp };
      const remoteVersion = { ...baseEvent, timestamp: remoteTimestamp };
      
      const resolved = resolveConflict(localVersion, remoteVersion);
      
      const expectedWinner = localTimestamp > remoteTimestamp ? localVersion : remoteVersion;
      return resolved.timestamp.equals(expectedWinner.timestamp);
    }
  ),
  { numRuns: 100 }
);
```

### Pruebas de Integración

1. **Flujo completo de medicación**
   - Programar medicamento → recibir alerta → confirmar administración → verificar registro

2. **Flujo de caída con factores de riesgo**
   - Registrar paciente con sedantes → verificar alerta de riesgo → registrar caída → verificar campos obligatorios

3. **Flujo offline-online**
   - Desconectar → registrar eventos → reconectar → verificar sincronización

4. **Flujo de múltiples pacientes**
   - Crear 3 pacientes → registrar eventos para cada uno → cambiar entre pacientes → verificar aislamiento

### Cobertura de Código

- Objetivo mínimo: 80% de cobertura de líneas
- Objetivo ideal: 90% de cobertura de líneas
- 100% de cobertura para lógica de validación crítica
- 100% de cobertura para manejo de restricciones éticas

### Pruebas de Accesibilidad

- Verificar contraste de colores en modo claro y oscuro
- Verificar navegación por teclado
- Verificar etiquetas ARIA en español
- Verificar tamaños de fuente legibles
- Verificar áreas táctiles mínimas (44x44px) para móvil

### Pruebas de Rendimiento

- Tiempo de carga inicial < 3 segundos
- Tiempo de respuesta de UI < 100ms
- Sincronización de 1000 eventos < 10 segundos
- Exportación PDF < 5 segundos
- Uso de memoria < 100MB en móvil

