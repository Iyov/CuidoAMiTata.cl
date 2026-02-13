# Documentación de API - CuidoAMiTata

Esta documentación describe las interfaces públicas de todos los servicios y managers del sistema.

## Tabla de Contenidos

1. [Servicios Core](#servicios-core)
2. [Managers de Cuidado](#managers-de-cuidado)
3. [Componentes React](#componentes-react)
4. [Hooks Personalizados](#hooks-personalizados)
5. [Tipos y Enumeraciones](#tipos-y-enumeraciones)

---

## Servicios Core

### StorageService

Gestiona el almacenamiento local con cifrado AES-256.

#### Métodos

##### `saveEncrypted(key: string, data: any): Result<void, Error>`

Guarda datos sensibles cifrados en IndexedDB.

**Parámetros:**
- `key`: Clave única para el dato
- `data`: Datos a cifrar y guardar

**Retorna:** `Result<void, Error>`

**Ejemplo:**
```typescript
import { StorageService } from '@/services/StorageService';

const result = await StorageService.saveEncrypted('patient_123', patientData);
if (result.isOk()) {
  console.log('Datos guardados exitosamente');
}
```

##### `loadEncrypted(key: string): Result<any, Error>`

Carga y descifra datos desde IndexedDB.

**Parámetros:**
- `key`: Clave del dato a cargar

**Retorna:** `Result<any, Error>`


##### `savePreference(key: string, value: any): Result<void, Error>`

Guarda preferencia de usuario en LocalStorage.

**Parámetros:**
- `key`: Clave de la preferencia
- `value`: Valor a guardar

**Retorna:** `Result<void, Error>`

##### `loadPreference(key: string): Result<any, Error>`

Carga preferencia de usuario desde LocalStorage.

##### `clearPatientData(patientId: string): Result<void, Error>`

Elimina todos los datos de un paciente específico.

---

### ValidationService

Valida datos de entrada en múltiples capas.

#### Métodos

##### `validateAdherenceWindow(scheduled: Date, actual: Date): boolean`

Valida que la administración ocurra dentro de la ventana de adherencia (±1.5 horas).

**Parámetros:**
- `scheduled`: Hora programada
- `actual`: Hora real de administración

**Retorna:** `boolean` - `true` si está dentro de la ventana

**Ejemplo:**
```typescript
const scheduled = new Date('2026-02-13T10:00:00');
const actual = new Date('2026-02-13T11:00:00');
const isValid = ValidationService.validateAdherenceWindow(scheduled, actual);
// isValid = true (dentro de 1.5 horas)
```

##### `validateBedElevation(degrees: number): ValidationResult`

Valida que la elevación de cama no exceda 30 grados.

**Parámetros:**
- `degrees`: Grados de elevación

**Retorna:** `ValidationResult`
```typescript
interface ValidationResult {
  isValid: boolean;
  errorCode?: ErrorCode;
  message?: string;
}
```

##### `validateRequiredField(field: any, fieldName: string): ValidationResult`

Valida que un campo obligatorio no esté vacío.

##### `validateDateRange(start: Date, end: Date): ValidationResult`

Valida que un rango de fechas sea válido.

---

### NotificationService

Gestiona notificaciones y alertas duales.

#### Métodos

##### `scheduleNotification(notification: Notification): Result<string, Error>`

Programa una notificación para un momento específico.

**Parámetros:**
- `notification`: Objeto de notificación

**Retorna:** `Result<string, Error>` - ID de la notificación

**Ejemplo:**
```typescript
const notification: Notification = {
  patientId: 'patient_123',
  type: 'MEDICATION',
  priority: 'CRITICAL',
  message: 'Administrar Aspirina 100mg',
  scheduledTime: new Date('2026-02-13T14:00:00'),
  isDualAlert: true
};

const result = await NotificationService.scheduleNotification(notification);
```

##### `emitDualAlert(message: string, priority: Priority): Result<void, Error>`

Emite una alerta dual (audio + visual) inmediatamente.

**Parámetros:**
- `message`: Mensaje de la alerta
- `priority`: Nivel de prioridad

##### `setReminderIfUnattended(notificationId: string, delayMinutes: number): Result<void, Error>`

Programa un recordatorio si la notificación no es atendida.

**Parámetros:**
- `notificationId`: ID de la notificación
- `delayMinutes`: Minutos de espera (por defecto 15)

##### `cancelNotification(notificationId: string): Result<void, Error>`

Cancela una notificación programada.

##### `getUserPreferences(): NotificationPreferences`

Obtiene las preferencias de notificación del usuario.

---

### AuthService

Gestiona autenticación y autorización.

#### Métodos

##### `login(credentials: Credentials): Result<AuthToken, Error>`

Autentica un usuario y devuelve un token JWT.

**Parámetros:**
```typescript
interface Credentials {
  email: string;
  password: string;
}
```

**Retorna:** `Result<AuthToken, Error>`

##### `logout(): Result<void, Error>`

Cierra la sesión del usuario actual.

##### `refreshToken(token: RefreshToken): Result<AuthToken, Error>`

Refresca un token expirado.

##### `checkSession(): SessionStatus`

Verifica el estado de la sesión actual.

##### `enforceAutoLogout(inactivityMinutes: number): Result<void, Error>`

Configura el cierre automático por inactividad (por defecto 15 minutos).

---

### DataSyncService

Gestiona sincronización offline-online.

#### Métodos

##### `syncPendingEvents(): Result<SyncReport, Error>`

Sincroniza todos los eventos pendientes con el backend.

**Retorna:** `Result<SyncReport, Error>`
```typescript
interface SyncReport {
  synced: number;
  failed: number;
  conflicts: number;
}
```

##### `resolveConflicts(conflicts: Conflict[]): Result<void, Error>`

Resuelve conflictos de sincronización (prioriza timestamp más reciente).

##### `getConnectionStatus(): ConnectionStatus`

Obtiene el estado actual de la conexión.

**Retorna:** `'ONLINE' | 'OFFLINE'`

##### `enableOfflineMode(): Result<void, Error>`

Habilita el modo offline manualmente.

##### `queueEventForSync(event: CareEvent): Result<void, Error>`

Añade un evento a la cola de sincronización.

---

## Managers de Cuidado

### MedicationManager

Gestiona programación y administración de medicamentos.

#### Métodos

##### `scheduleMedication(medication: Medication, schedule: Schedule): Result<void, Error>`

Programa un medicamento con su horario.

**Parámetros:**
```typescript
interface Medication {
  name: string;
  dosage: string;
  purpose: string;
  stockLevel: number;
  expirationDate: Date;
}

interface Schedule {
  times: Date[];
  frequency: 'DAILY' | 'WEEKLY' | 'AS_NEEDED';
  daysOfWeek?: number[];
}
```

**Ejemplo:**
```typescript
const medication: Medication = {
  name: 'Aspirina',
  dosage: '100mg',
  purpose: 'Anticoagulante',
  stockLevel: 30,
  expirationDate: new Date('2027-12-31')
};

const schedule: Schedule = {
  times: [new Date('2026-02-13T08:00:00')],
  frequency: 'DAILY'
};

await MedicationManager.scheduleMedication(medication, schedule);
```

##### `confirmAdministration(medicationId: string, timestamp: Date): Result<Confirmation, Error>`

Confirma la administración de una dosis.

**Validaciones:**
- Debe estar dentro de la ventana de adherencia (±1.5 horas)
- Registra marca temporal

##### `omitDose(medicationId: string, justification: string, timestamp: Date): Result<void, Error>`

Omite una dosis con justificación obligatoria.

**Parámetros:**
- `medicationId`: ID del medicamento
- `justification`: Razón de la omisión (obligatorio, mínimo 10 caracteres)
- `timestamp`: Momento de la omisión

##### `getMedicationSheet(): MedicationSheet`

Obtiene la hoja completa de medicamentos del paciente actual.

##### `checkAdherenceWindow(scheduledTime: Date, actualTime: Date): boolean`

Verifica si una administración está dentro de la ventana de adherencia.

---

### FallPreventionManager

Gestiona prevención de caídas y evaluación de riesgos.

#### Métodos

##### `submitDailyChecklist(checklist: RiskChecklist): Result<void, Error>`

Envía la lista de verificación diaria de riesgos.

**Parámetros:**
```typescript
interface RiskChecklist {
  checkDate: Date;
  lighting: 'ADEQUATE' | 'INADEQUATE';
  flooring: 'SAFE' | 'HAZARDOUS';
  footwear: 'APPROPRIATE' | 'INAPPROPRIATE';
  notes: string;
}
```

##### `recordFallIncident(incident: FallIncident): Result<void, Error>`

Registra un incidente de caída.

**Parámetros:**
```typescript
interface FallIncident {
  occurredAt: Date;
  timeOnFloor: number;  // minutos (obligatorio)
  location: string;
  circumstances: string;
  injuries: string[];
}
```

**Validaciones:**
- Campo `timeOnFloor` es obligatorio

##### `getRiskAlerts(patient: Patient): RiskAlert[]`

Obtiene alertas de riesgo basadas en factores del paciente.

**Factores de riesgo:**
- Sedantes prescritos
- Deterioro cognitivo
- Problemas de visión
- Problemas de movilidad

##### `calculateRiskScore(patient: Patient): RiskScore`

Calcula puntuación agregada de riesgo de caídas.

---

### SkinIntegrityManager

Gestiona cambios posturales y monitoreo de úlceras por presión.

#### Métodos

##### `schedulePosturalChanges(daySchedule: Schedule, nightSchedule: Schedule): Result<void, Error>`

Programa cambios posturales.

**Programación:**
- Día (06:00-22:00): Cada 2 horas (8 notificaciones)
- Noche (22:00-06:00): 3 notificaciones

##### `recordPosturalChange(timestamp: Date, position: Position): Result<void, Error>`

Registra un cambio postural realizado.

**Parámetros:**
```typescript
type Position = 'SUPINE' | 'LEFT_LATERAL' | 'RIGHT_LATERAL' | 'PRONE' | 'SEATED';
```

##### `recordBedElevation(degrees: number): Result<ValidationResult, Error>`

Registra elevación de cama con validación.

**Validaciones:**
- Máximo 30 grados
- Mínimo 0 grados

##### `recordPressureUlcer(ulcer: PressureUlcer, photo: Photo): Result<void, Error>`

Registra una úlcera por presión con fotografía.

**Parámetros:**
```typescript
interface PressureUlcer {
  grade: 'I' | 'II' | 'III' | 'IV';
  location: string;
  size: { length: number; width: number; depth?: number };
  treatment: string;
}

interface Photo {
  url: string;
  capturedAt: Date;
  notes: string;
}
```

##### `classifyUlcerGrade(characteristics: UlcerCharacteristics): UlcerGrade`

Clasifica automáticamente el grado de una úlcera.

---

### NutritionManager

Gestiona nutrición e hidratación según directrices SEGG.

#### Métodos

##### `scheduleHydrationReminders(targetGlasses: number): Result<void, Error>`

Programa recordatorios de hidratación.

**Parámetros:**
- `targetGlasses`: Objetivo diario (por defecto 6-8 vasos)

##### `recordFluidIntake(glasses: number, timestamp: Date): Result<void, Error>`

Registra ingesta de líquidos y actualiza contador.

##### `getDailyHydrationStatus(): HydrationStatus`

Obtiene el estado de hidratación del día.

**Retorna:**
```typescript
interface HydrationStatus {
  current: number;
  target: number;
  percentage: number;
  lastIntake?: Date;
}
```

##### `generateSEGGMealPlan(): MealPlan`

Genera plan de comidas basado en directrices SEGG.

**Características:**
- 5 comidas diarias
- Incluye: pescado, aceite de oliva, yogur
- Estructura: Desayuno, Media mañana, Almuerzo, Merienda, Cena

##### `recordMealIntake(meal: Meal, timestamp: Date): Result<void, Error>`

Registra ingesta de comida con marca temporal.

---

### IncontinenceManager

Gestiona control de incontinencia.

#### Métodos

##### `scheduleBathroomReminders(intervalHours: number): Result<void, Error>`

Programa recordatorios de visita al baño.

**Parámetros:**
- `intervalHours`: Intervalo en horas (2-3 horas recomendado)

##### `recordBathroomVisit(timestamp: Date): Result<void, Error>`

Registra una visita al baño exitosa.

##### `recordIncontinenceEpisode(episode: IncontinenceEpisode): Result<void, Error>`

Registra un episodio de incontinencia.

**Parámetros:**
```typescript
interface IncontinenceEpisode {
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  occurredAt: Date;
  notes: string;
}
```

##### `analyzePatterns(dateRange: DateRange): PatternAnalysis`

Analiza patrones de incontinencia en un rango de fechas.

**Retorna:**
```typescript
interface PatternAnalysis {
  totalEpisodes: number;
  averagePerDay: number;
  peakHours: number[];
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
}
```

---

### PolypharmacyManager

Gestiona polifarmacia y disposición de medicamentos.

#### Métodos

##### `addMedication(medication: MedicationDetails): Result<void, Error>`

Añade un medicamento a la hoja dinámica.

##### `updateMedicationSheet(updates: MedicationUpdate[]): Result<void, Error>`

Actualiza múltiples medicamentos.

##### `exportToPDF(): Result<PDFDocument, Error>`

Exporta la hoja de medicamentos a PDF.

**Campos incluidos:**
- Nombre del medicamento
- Dosis
- Propósito
- Horarios
- Stock actual
- Fecha de caducidad

##### `checkStockLevels(): StockAlert[]`

Verifica niveles de stock y genera alertas.

**Retorna:** Array de alertas para medicamentos con stock bajo

##### `checkExpirationDates(): ExpirationAlert[]`

Verifica fechas de caducidad y genera alertas.

**Retorna:** Array de alertas para medicamentos próximos a caducar

##### `findNearestSIGREPoint(location: Location): SIGREPoint[]`

Encuentra puntos SIGRE cercanos para disposición de medicamentos.

---

### EthicalCareModule

Previene restricciones inapropiadas y promueve alternativas éticas.

#### Métodos

##### `validateRestraint(restraint: Restraint): ValidationResult`

Valida una restricción antes de registrarla.

**Validaciones:**
- Bloquea restricciones químicas (sedantes para manejo conductual)
- Requiere justificación documentada

##### `classifyRestraint(restraint: Restraint): RestraintType`

Clasifica automáticamente el tipo de restricción.

**Tipos:**
- `CHEMICAL`: Sedantes, tranquilizantes
- `MECHANICAL`: Barandillas, sujeciones físicas
- `ENVIRONMENTAL`: Puertas cerradas, áreas restringidas

##### `getAlternativeStrategies(situation: CareContext): Strategy[]`

Obtiene estrategias alternativas a restricciones.

**Estrategias incluidas:**
- Técnicas de distracción
- Comunicación efectiva
- Modificación ambiental
- Actividades terapéuticas

##### `requireJustification(restraint: Restraint): JustificationForm`

Genera formulario de justificación obligatoria.

---

### PatientManager

Gestiona múltiples perfiles de pacientes.

#### Métodos

##### `createPatientProfile(patient: Patient): Result<string, Error>`

Crea un nuevo perfil de paciente.

**Retorna:** ID del paciente creado

##### `selectPatient(patientId: string): Result<void, Error>`

Selecciona un paciente activo.

**Efecto:** Filtra todos los datos y alertas para mostrar solo los del paciente seleccionado

##### `switchPatient(patientId: string): Result<void, Error>`

Cambia rápidamente entre pacientes.

##### `getPatientAlerts(patientId: string): Alert[]`

Obtiene todas las alertas pendientes de un paciente.

---

### HistoryService

Gestiona historial y auditoría de eventos.

#### Métodos

##### `getHistory(options?: HistoryOptions): CareEvent[]`

Obtiene historial de eventos con opciones de filtrado.

**Parámetros:**
```typescript
interface HistoryOptions {
  patientId?: string;
  eventType?: CareEventType;
  startDate?: Date;
  endDate?: Date;
  sortOrder?: 'ASC' | 'DESC';
}
```

**Retorna:** Array de eventos ordenados cronológicamente

##### `filterByEventType(eventType: CareEventType): CareEvent[]`

Filtra eventos por tipo.

##### `filterByDateRange(start: Date, end: Date): CareEvent[]`

Filtra eventos por rango de fechas.

##### `exportHistoryWithTimestamps(format: 'PDF' | 'CSV' | 'JSON'): Result<Blob, Error>`

Exporta historial con todas las marcas temporales.

---

## Componentes React

### Button

Botón reutilizable con variantes y estados.

#### Props

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}
```

#### Ejemplo

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Guardar
</Button>
```

---

### Input

Campo de entrada con validación y mensajes de error.

#### Props

```typescript
interface InputProps {
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'date' | 'time';
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}
```

#### Ejemplo

```tsx
<Input
  label="Dosis"
  type="text"
  value={dosage}
  onChange={setDosage}
  required
  error={errors.dosage}
/>
```

---

### Card

Contenedor de contenido con estilos consistentes.

#### Props

```typescript
interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  className?: string;
}
```

---

### Alert

Componente de alerta con diferentes niveles de severidad.

#### Props

```typescript
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
}
```

---

### Toast

Notificación temporal tipo toast.

#### Props

```typescript
interface ToastProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;  // milisegundos
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}
```

---

### ThemeToggle

Botón para alternar entre modo claro y oscuro.

#### Uso

```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

<ThemeToggle />
```

---

### ErrorBoundary

Componente para capturar errores de React.

#### Props

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

#### Ejemplo

```tsx
<ErrorBoundary fallback={<ErrorMessage />}>
  <App />
</ErrorBoundary>
```

---

## Hooks Personalizados

### useToast

Hook para mostrar notificaciones toast.

#### Uso

```typescript
import { useToast } from '@/hooks/useToast';

const { showToast } = useToast();

showToast({
  message: 'Medicamento guardado exitosamente',
  type: 'success',
  duration: 3000
});
```

---

### useTheme

Hook para gestionar el tema de la aplicación.

#### Uso

```typescript
import { useTheme } from '@/contexts/ThemeContext';

const { theme, toggleTheme, setTheme } = useTheme();

// theme: 'DARK' | 'LIGHT'
// toggleTheme: () => void
// setTheme: (theme: Theme) => void
```

---

## Tipos y Enumeraciones

### ErrorCode

Códigos de error del sistema.

```typescript
enum ErrorCode {
  // Validación (1000-1999)
  VALIDATION_REQUIRED_FIELD = 1001,
  VALIDATION_ADHERENCE_WINDOW = 1002,
  VALIDATION_BED_ELEVATION = 1003,
  
  // Conectividad (2000-2999)
  NETWORK_OFFLINE = 2001,
  NETWORK_TIMEOUT = 2002,
  AUTH_TOKEN_EXPIRED = 2003,
  
  // Negocio (3000-3999)
  BUSINESS_CHEMICAL_RESTRAINT_BLOCKED = 3001,
  BUSINESS_JUSTIFICATION_REQUIRED = 3003,
  
  // Sistema (4000-4999)
  SYSTEM_ENCRYPTION_FAILED = 4001,
  SYSTEM_STORAGE_QUOTA_EXCEEDED = 4002,
  
  // Sincronización (5000-5999)
  SYNC_CONFLICT = 5001,
  SYNC_FAILED = 5002
}
```

---

### Priority

Niveles de prioridad para notificaciones y alertas.

```typescript
enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

---

### CareEventType

Tipos de eventos de cuidado.

```typescript
enum CareEventType {
  MEDICATION = 'MEDICATION',
  FALL = 'FALL',
  POSTURAL_CHANGE = 'POSTURAL_CHANGE',
  NUTRITION = 'NUTRITION',
  INCONTINENCE = 'INCONTINENCE',
  RESTRAINT = 'RESTRAINT',
  ASSESSMENT = 'ASSESSMENT'
}
```

---

### Result<T, E>

Tipo para manejo de errores funcional.

```typescript
type Result<T, E = Error> = Ok<T> | Err<E>;

// Constructores
function Ok<T>(value: T): Result<T, never>;
function Err<E>(error: E): Result<never, E>;

// Métodos
result.isOk(): boolean
result.isErr(): boolean
result.unwrap(): T
result.unwrapOr(defaultValue: T): T
result.map<U>(fn: (value: T) => U): Result<U, E>
result.mapErr<F>(fn: (error: E) => F): Result<T, F>
```

#### Ejemplo

```typescript
function dividir(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Err('División por cero');
  }
  return Ok(a / b);
}

const resultado = dividir(10, 2);
if (resultado.isOk()) {
  console.log('Resultado:', resultado.unwrap());
} else {
  console.error('Error:', resultado.error);
}
```

---

## Constantes

### Constantes de Validación

```typescript
export const ADHERENCE_WINDOW_MINUTES = 90;  // 1.5 horas
export const MAX_BED_ELEVATION_DEGREES = 30;
export const MIN_JUSTIFICATION_LENGTH = 10;
```

### Constantes de Programación

```typescript
export const POSTURAL_CHANGE_INTERVAL_DAY_HOURS = 2;
export const POSTURAL_CHANGE_COUNT_NIGHT = 3;
export const BATHROOM_REMINDER_INTERVAL_HOURS = 2.5;
export const HYDRATION_TARGET_GLASSES = 8;
```

### Constantes de Seguridad

```typescript
export const AUTO_LOGOUT_MINUTES = 15;
export const TOKEN_REFRESH_THRESHOLD_MINUTES = 5;
export const MAX_LOGIN_ATTEMPTS = 3;
```

---

## Mensajes de Error en Español

Todos los mensajes de error están en español y son descriptivos:

```typescript
export const ERROR_MESSAGES = {
  ADHERENCE_WINDOW: 'La administración debe ocurrir dentro de 3 horas del horario programado',
  BED_ELEVATION: 'La elevación de la cama no puede exceder 30 grados',
  JUSTIFICATION_REQUIRED: 'Debe proporcionar una justificación para esta acción',
  CHEMICAL_RESTRAINT: 'No se pueden usar sedantes para manejo conductual. Consulte las estrategias alternativas.',
  TIME_ON_FLOOR_REQUIRED: 'Debe registrar el tiempo en el suelo para incidentes de caída',
  // ... más mensajes
};
```

---

## Notas de Implementación

### Manejo de Errores

Todos los métodos que pueden fallar retornan un tipo `Result<T, E>`:

```typescript
const result = await service.method();
if (result.isOk()) {
  // Éxito
  const value = result.unwrap();
} else {
  // Error
  const error = result.error;
}
```

### Validación en Múltiples Capas

1. **Capa UI**: Validación de formato y campos requeridos
2. **Capa Servicios**: Validación de reglas de negocio
3. **Capa Managers**: Validación de lógica específica del dominio

### Marcas Temporales

Todos los eventos incluyen marcas temporales precisas:

```typescript
interface CareEvent {
  timestamp: Date;
  createdAt: Date;
  // ... otros campos
}
```

### Aislamiento de Datos

Los datos de cada paciente están completamente aislados:

```typescript
// Seleccionar paciente filtra automáticamente todos los datos
await PatientManager.selectPatient('patient_123');
const events = await HistoryService.getHistory();
// events solo contiene eventos de patient_123
```

---

## Soporte

Para más información, consulta:

- [Guía de Usuario](USER_GUIDE.md)
- [Arquitectura del Sistema](ARCHITECTURE.md)
- [Especificaciones](.kiro/specs/cuido-a-mi-tata/)

---

**Última actualización**: 2026-02-13
