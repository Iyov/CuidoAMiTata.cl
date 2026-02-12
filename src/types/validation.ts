import { ErrorCode } from './enums';
import { Err, Ok, Result } from './result';
import {
  CareEvent,
  Medication,
  MedicationEvent,
  Notification,
  Patient,
  User,
  UserPreferences,
} from './models';

/**
 * Valida que un campo requerido no esté vacío
 */
export function validateRequiredField(
  value: unknown,
  fieldName: string
): Result<void> {
  if (value === undefined || value === null || value === '') {
    return Err({
      code: ErrorCode.VALIDATION_REQUIRED_FIELD,
      message: `El campo "${fieldName}" es obligatorio`,
    });
  }
  return Ok(undefined);
}

/**
 * Valida que una cadena tenga una longitud mínima
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName: string
): Result<void> {
  if (value.length < minLength) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: `El campo "${fieldName}" debe tener al menos ${minLength} caracteres`,
    });
  }
  return Ok(undefined);
}

/**
 * Valida que una fecha sea válida
 */
export function validateDate(value: Date, fieldName: string): Result<void> {
  if (!(value instanceof Date) || isNaN(value.getTime())) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: `El campo "${fieldName}" debe ser una fecha válida`,
    });
  }
  return Ok(undefined);
}

/**
 * Valida que un email tenga formato válido
 */
export function validateEmail(email: string): Result<void> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: 'El formato del email no es válido',
    });
  }
  return Ok(undefined);
}

/**
 * Valida un objeto Patient
 */
export function validatePatient(patient: Partial<Patient>): Result<Patient> {
  const errors: string[] = [];

  // Validar campos requeridos
  const idResult = validateRequiredField(patient.id, 'id');
  if (!idResult.ok) errors.push(idResult.error.message);

  const nameResult = validateRequiredField(patient.name, 'name');
  if (!nameResult.ok) errors.push(nameResult.error.message);

  const dobResult = validateRequiredField(patient.dateOfBirth, 'dateOfBirth');
  if (!dobResult.ok) {
    errors.push(dobResult.error.message);
  } else {
    const dateResult = validateDate(patient.dateOfBirth!, 'dateOfBirth');
    if (!dateResult.ok) errors.push(dateResult.error.message);
  }

  // Validar arrays requeridos
  if (!Array.isArray(patient.riskFactors)) {
    errors.push('El campo "riskFactors" debe ser un array');
  }
  if (!Array.isArray(patient.medications)) {
    errors.push('El campo "medications" debe ser un array');
  }
  if (!Array.isArray(patient.careHistory)) {
    errors.push('El campo "careHistory" debe ser un array');
  }

  // Validar fechas de auditoría
  if (patient.createdAt) {
    const createdResult = validateDate(patient.createdAt, 'createdAt');
    if (!createdResult.ok) errors.push(createdResult.error.message);
  }
  if (patient.updatedAt) {
    const updatedResult = validateDate(patient.updatedAt, 'updatedAt');
    if (!updatedResult.ok) errors.push(updatedResult.error.message);
  }

  if (errors.length > 0) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: 'Errores de validación en Patient',
      details: errors,
    });
  }

  return Ok(patient as Patient);
}

/**
 * Valida un objeto Medication
 */
export function validateMedication(
  medication: Partial<Medication>
): Result<Medication> {
  const errors: string[] = [];

  // Validar campos requeridos
  const idResult = validateRequiredField(medication.id, 'id');
  if (!idResult.ok) errors.push(idResult.error.message);

  const patientIdResult = validateRequiredField(
    medication.patientId,
    'patientId'
  );
  if (!patientIdResult.ok) errors.push(patientIdResult.error.message);

  const nameResult = validateRequiredField(medication.name, 'name');
  if (!nameResult.ok) errors.push(nameResult.error.message);

  const dosageResult = validateRequiredField(medication.dosage, 'dosage');
  if (!dosageResult.ok) errors.push(dosageResult.error.message);

  const purposeResult = validateRequiredField(medication.purpose, 'purpose');
  if (!purposeResult.ok) errors.push(purposeResult.error.message);

  // Validar schedule
  if (!medication.schedule) {
    errors.push('El campo "schedule" es obligatorio');
  } else {
    if (!Array.isArray(medication.schedule.times)) {
      errors.push('El campo "schedule.times" debe ser un array');
    }
    if (!medication.schedule.frequency) {
      errors.push('El campo "schedule.frequency" es obligatorio');
    }
  }

  // Validar stockLevel
  if (
    medication.stockLevel !== undefined &&
    medication.stockLevel !== null &&
    medication.stockLevel < 0
  ) {
    errors.push('El campo "stockLevel" no puede ser negativo');
  }

  // Validar expirationDate
  if (medication.expirationDate) {
    const expResult = validateDate(medication.expirationDate, 'expirationDate');
    if (!expResult.ok) errors.push(expResult.error.message);
  }

  // Validar createdAt
  if (medication.createdAt) {
    const createdResult = validateDate(medication.createdAt, 'createdAt');
    if (!createdResult.ok) errors.push(createdResult.error.message);
  }

  if (errors.length > 0) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: 'Errores de validación en Medication',
      details: errors,
    });
  }

  return Ok(medication as Medication);
}

/**
 * Valida un objeto MedicationEvent
 */
export function validateMedicationEvent(
  event: Partial<MedicationEvent>
): Result<MedicationEvent> {
  const errors: string[] = [];

  // Validar campos requeridos
  const idResult = validateRequiredField(event.id, 'id');
  if (!idResult.ok) errors.push(idResult.error.message);

  const medIdResult = validateRequiredField(event.medicationId, 'medicationId');
  if (!medIdResult.ok) errors.push(medIdResult.error.message);

  const patientIdResult = validateRequiredField(event.patientId, 'patientId');
  if (!patientIdResult.ok) errors.push(patientIdResult.error.message);

  const statusResult = validateRequiredField(event.status, 'status');
  if (!statusResult.ok) errors.push(statusResult.error.message);

  // Validar scheduledTime
  if (event.scheduledTime) {
    const schedResult = validateDate(event.scheduledTime, 'scheduledTime');
    if (!schedResult.ok) errors.push(schedResult.error.message);
  } else {
    errors.push('El campo "scheduledTime" es obligatorio');
  }

  // Validar actualTime si existe
  if (event.actualTime) {
    const actualResult = validateDate(event.actualTime, 'actualTime');
    if (!actualResult.ok) errors.push(actualResult.error.message);
  }

  // Validar justificación si el estado es OMITTED
  if (event.status === 'OMITTED') {
    const justResult = validateRequiredField(event.justification, 'justification');
    if (!justResult.ok) {
      return Err({
        code: ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED,
        message: 'Debe proporcionar una justificación para omitir esta dosis',
      });
    }
    const minLengthResult = validateMinLength(
      event.justification!,
      10,
      'justification'
    );
    if (!minLengthResult.ok) errors.push(minLengthResult.error.message);
  }

  // Validar createdAt
  if (event.createdAt) {
    const createdResult = validateDate(event.createdAt, 'createdAt');
    if (!createdResult.ok) errors.push(createdResult.error.message);
  }

  if (errors.length > 0) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: 'Errores de validación en MedicationEvent',
      details: errors,
    });
  }

  return Ok(event as MedicationEvent);
}

/**
 * Valida un objeto Notification
 */
export function validateNotification(
  notification: Partial<Notification>
): Result<Notification> {
  const errors: string[] = [];

  // Validar campos requeridos
  const idResult = validateRequiredField(notification.id, 'id');
  if (!idResult.ok) errors.push(idResult.error.message);

  const patientIdResult = validateRequiredField(
    notification.patientId,
    'patientId'
  );
  if (!patientIdResult.ok) errors.push(patientIdResult.error.message);

  const typeResult = validateRequiredField(notification.type, 'type');
  if (!typeResult.ok) errors.push(typeResult.error.message);

  const priorityResult = validateRequiredField(notification.priority, 'priority');
  if (!priorityResult.ok) errors.push(priorityResult.error.message);

  const messageResult = validateRequiredField(notification.message, 'message');
  if (!messageResult.ok) errors.push(messageResult.error.message);

  const statusResult = validateRequiredField(notification.status, 'status');
  if (!statusResult.ok) errors.push(statusResult.error.message);

  // Validar scheduledTime
  if (notification.scheduledTime) {
    const schedResult = validateDate(notification.scheduledTime, 'scheduledTime');
    if (!schedResult.ok) errors.push(schedResult.error.message);
  } else {
    errors.push('El campo "scheduledTime" es obligatorio');
  }

  // Validar createdAt
  if (notification.createdAt) {
    const createdResult = validateDate(notification.createdAt, 'createdAt');
    if (!createdResult.ok) errors.push(createdResult.error.message);
  }

  // Validar isDualAlert
  if (typeof notification.isDualAlert !== 'boolean') {
    errors.push('El campo "isDualAlert" debe ser un booleano');
  }

  // Validar reminderSent
  if (typeof notification.reminderSent !== 'boolean') {
    errors.push('El campo "reminderSent" debe ser un booleano');
  }

  if (errors.length > 0) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: 'Errores de validación en Notification',
      details: errors,
    });
  }

  return Ok(notification as Notification);
}

/**
 * Valida un objeto CareEvent
 */
export function validateCareEvent(event: Partial<CareEvent>): Result<CareEvent> {
  const errors: string[] = [];

  // Validar campos requeridos
  const idResult = validateRequiredField(event.id, 'id');
  if (!idResult.ok) errors.push(idResult.error.message);

  const patientIdResult = validateRequiredField(event.patientId, 'patientId');
  if (!patientIdResult.ok) errors.push(patientIdResult.error.message);

  const eventTypeResult = validateRequiredField(event.eventType, 'eventType');
  if (!eventTypeResult.ok) errors.push(eventTypeResult.error.message);

  const performedByResult = validateRequiredField(
    event.performedBy,
    'performedBy'
  );
  if (!performedByResult.ok) errors.push(performedByResult.error.message);

  const syncStatusResult = validateRequiredField(event.syncStatus, 'syncStatus');
  if (!syncStatusResult.ok) errors.push(syncStatusResult.error.message);

  // Validar timestamp
  if (event.timestamp) {
    const timestampResult = validateDate(event.timestamp, 'timestamp');
    if (!timestampResult.ok) errors.push(timestampResult.error.message);
  } else {
    errors.push('El campo "timestamp" es obligatorio');
  }

  // Validar createdAt
  if (event.createdAt) {
    const createdResult = validateDate(event.createdAt, 'createdAt');
    if (!createdResult.ok) errors.push(createdResult.error.message);
  }

  // Validar metadata
  if (!event.metadata || typeof event.metadata !== 'object') {
    errors.push('El campo "metadata" debe ser un objeto');
  }

  if (errors.length > 0) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: 'Errores de validación en CareEvent',
      details: errors,
    });
  }

  return Ok(event as CareEvent);
}

/**
 * Valida un objeto User
 */
export function validateUser(user: Partial<User>): Result<User> {
  const errors: string[] = [];

  // Validar campos requeridos
  const idResult = validateRequiredField(user.id, 'id');
  if (!idResult.ok) errors.push(idResult.error.message);

  const nameResult = validateRequiredField(user.name, 'name');
  if (!nameResult.ok) errors.push(nameResult.error.message);

  const roleResult = validateRequiredField(user.role, 'role');
  if (!roleResult.ok) errors.push(roleResult.error.message);

  // Validar email
  if (user.email) {
    const emailResult = validateEmail(user.email);
    if (!emailResult.ok) errors.push(emailResult.error.message);
  } else {
    errors.push('El campo "email" es obligatorio');
  }

  // Validar patients array
  if (!Array.isArray(user.patients)) {
    errors.push('El campo "patients" debe ser un array');
  }

  // Validar preferences
  if (!user.preferences) {
    errors.push('El campo "preferences" es obligatorio');
  } else {
    const prefsResult = validateUserPreferences(user.preferences);
    if (!prefsResult.ok) {
      errors.push(prefsResult.error.message);
    }
  }

  // Validar lastLogin
  if (user.lastLogin) {
    const lastLoginResult = validateDate(user.lastLogin, 'lastLogin');
    if (!lastLoginResult.ok) errors.push(lastLoginResult.error.message);
  }

  // Validar createdAt
  if (user.createdAt) {
    const createdResult = validateDate(user.createdAt, 'createdAt');
    if (!createdResult.ok) errors.push(createdResult.error.message);
  }

  if (errors.length > 0) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: 'Errores de validación en User',
      details: errors,
    });
  }

  return Ok(user as User);
}

/**
 * Valida un objeto UserPreferences
 */
export function validateUserPreferences(
  prefs: Partial<UserPreferences>
): Result<UserPreferences> {
  const errors: string[] = [];

  // Validar theme
  const themeResult = validateRequiredField(prefs.theme, 'theme');
  if (!themeResult.ok) errors.push(themeResult.error.message);

  // Validar language
  if (prefs.language !== 'es') {
    errors.push('El campo "language" debe ser "es"');
  }

  // Validar notificationSettings
  if (!prefs.notificationSettings) {
    errors.push('El campo "notificationSettings" es obligatorio');
  } else {
    if (typeof prefs.notificationSettings.enableSound !== 'boolean') {
      errors.push('El campo "notificationSettings.enableSound" debe ser un booleano');
    }
    if (typeof prefs.notificationSettings.enableVibration !== 'boolean') {
      errors.push(
        'El campo "notificationSettings.enableVibration" debe ser un booleano'
      );
    }
    if (typeof prefs.notificationSettings.enablePushNotifications !== 'boolean') {
      errors.push(
        'El campo "notificationSettings.enablePushNotifications" debe ser un booleano'
      );
    }
  }

  // Validar autoLogoutMinutes
  if (
    prefs.autoLogoutMinutes !== undefined &&
    prefs.autoLogoutMinutes !== null
  ) {
    if (prefs.autoLogoutMinutes < 1) {
      errors.push('El campo "autoLogoutMinutes" debe ser mayor que 0');
    }
  }

  if (errors.length > 0) {
    return Err({
      code: ErrorCode.VALIDATION_INVALID_FORMAT,
      message: 'Errores de validación en UserPreferences',
      details: errors,
    });
  }

  return Ok(prefs as UserPreferences);
}
