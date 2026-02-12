import { describe, it, expect } from 'vitest';
import {
  validateRequiredField,
  validateMinLength,
  validateDate,
  validateEmail,
  validatePatient,
  validateMedication,
  validateMedicationEvent,
  validateNotification,
  validateCareEvent,
  validateUser,
  validateUserPreferences,
} from './validation';
import {
  ErrorCode,
  Theme,
  UserRole,
  ScheduleFrequency,
  MedicationEventStatus,
  NotificationType,
  Priority,
  NotificationStatus,
  CareEventType,
  SyncStatus,
} from './enums';
import type {
  Patient,
  Medication,
  MedicationEvent,
  Notification,
  CareEvent,
  User,
  UserPreferences,
} from './models';

describe('Validation Functions', () => {
  describe('validateRequiredField', () => {
    it('should return Ok for valid values', () => {
      const result = validateRequiredField('test', 'field');
      expect(result.ok).toBe(true);
    });

    it('should return Err for undefined', () => {
      const result = validateRequiredField(undefined, 'field');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });

    it('should return Err for null', () => {
      const result = validateRequiredField(null, 'field');
      expect(result.ok).toBe(false);
    });

    it('should return Err for empty string', () => {
      const result = validateRequiredField('', 'field');
      expect(result.ok).toBe(false);
    });
  });

  describe('validateMinLength', () => {
    it('should return Ok for strings meeting minimum length', () => {
      const result = validateMinLength('test string', 5, 'field');
      expect(result.ok).toBe(true);
    });

    it('should return Err for strings below minimum length', () => {
      const result = validateMinLength('test', 10, 'field');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
      }
    });
  });

  describe('validateDate', () => {
    it('should return Ok for valid dates', () => {
      const result = validateDate(new Date(), 'field');
      expect(result.ok).toBe(true);
    });

    it('should return Err for invalid dates', () => {
      const result = validateDate(new Date('invalid'), 'field');
      expect(result.ok).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return Ok for valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.ok).toBe(true);
    });

    it('should return Err for invalid email', () => {
      const result = validateEmail('invalid-email');
      expect(result.ok).toBe(false);
    });
  });

  describe('validatePatient', () => {
    it('should return Ok for valid patient', () => {
      const patient: Patient = {
        id: 'patient-1',
        name: 'Juan Pérez',
        dateOfBirth: new Date('1950-01-01'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validatePatient(patient);
      expect(result.ok).toBe(true);
    });

    it('should return Err for patient missing required fields', () => {
      const patient = {
        name: 'Juan Pérez',
      };

      const result = validatePatient(patient);
      expect(result.ok).toBe(false);
    });
  });

  describe('validateMedication', () => {
    it('should return Ok for valid medication', () => {
      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {
          times: [new Date()],
          frequency: ScheduleFrequency.DAILY,
        },
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      const result = validateMedication(medication);
      expect(result.ok).toBe(true);
    });

    it('should return Err for medication with negative stock', () => {
      const medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {
          times: [new Date()],
          frequency: ScheduleFrequency.DAILY,
        },
        stockLevel: -5,
        expirationDate: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      const result = validateMedication(medication);
      expect(result.ok).toBe(false);
    });
  });

  describe('validateMedicationEvent', () => {
    it('should return Ok for valid confirmed event', () => {
      const event: MedicationEvent = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime: new Date(),
        actualTime: new Date(),
        status: MedicationEventStatus.CONFIRMED,
        withinAdherenceWindow: true,
        createdAt: new Date(),
      };

      const result = validateMedicationEvent(event);
      expect(result.ok).toBe(true);
    });

    it('should return Err for omitted event without justification', () => {
      const event = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime: new Date(),
        status: MedicationEventStatus.OMITTED,
        withinAdherenceWindow: false,
        createdAt: new Date(),
      };

      const result = validateMedicationEvent(event);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED);
      }
    });

    it('should return Ok for omitted event with valid justification', () => {
      const event: MedicationEvent = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime: new Date(),
        status: MedicationEventStatus.OMITTED,
        justification: 'Paciente presentó náuseas y vómitos',
        withinAdherenceWindow: false,
        createdAt: new Date(),
      };

      const result = validateMedicationEvent(event);
      expect(result.ok).toBe(true);
    });
  });

  describe('validateNotification', () => {
    it('should return Ok for valid notification', () => {
      const notification: Notification = {
        id: 'notif-1',
        patientId: 'patient-1',
        type: NotificationType.MEDICATION,
        priority: Priority.HIGH,
        message: 'Hora de tomar medicamento',
        scheduledTime: new Date(),
        isDualAlert: true,
        status: NotificationStatus.SCHEDULED,
        reminderSent: false,
        createdAt: new Date(),
      };

      const result = validateNotification(notification);
      expect(result.ok).toBe(true);
    });

    it('should return Err for notification missing required fields', () => {
      const notification = {
        id: 'notif-1',
        patientId: 'patient-1',
      };

      const result = validateNotification(notification);
      expect(result.ok).toBe(false);
    });
  });

  describe('validateCareEvent', () => {
    it('should return Ok for valid care event', () => {
      const event: CareEvent = {
        id: 'event-1',
        patientId: 'patient-1',
        eventType: CareEventType.MEDICATION,
        timestamp: new Date(),
        performedBy: 'caregiver-1',
        syncStatus: SyncStatus.SYNCED,
        metadata: { notes: 'Administrado correctamente' },
        createdAt: new Date(),
      };

      const result = validateCareEvent(event);
      expect(result.ok).toBe(true);
    });

    it('should return Err for care event without timestamp', () => {
      const event = {
        id: 'event-1',
        patientId: 'patient-1',
        eventType: CareEventType.MEDICATION,
        performedBy: 'caregiver-1',
        syncStatus: SyncStatus.SYNCED,
        metadata: {},
        createdAt: new Date(),
      };

      const result = validateCareEvent(event);
      expect(result.ok).toBe(false);
    });
  });

  describe('validateUser', () => {
    it('should return Ok for valid user', () => {
      const user: User = {
        id: 'user-1',
        email: 'caregiver@example.com',
        name: 'María García',
        role: UserRole.CAREGIVER,
        patients: ['patient-1', 'patient-2'],
        preferences: {
          theme: Theme.DARK,
          language: 'es' as const,
          notificationSettings: {
            enableSound: true,
            enableVibration: true,
            enablePushNotifications: true,
            priorityFilter: 'ALL' as const,
          },
          autoLogoutMinutes: 15,
        },
        lastLogin: new Date(),
        createdAt: new Date(),
      };

      const result = validateUser(user);
      expect(result.ok).toBe(true);
    });

    it('should return Err for user with invalid email', () => {
      const user = {
        id: 'user-1',
        email: 'invalid-email',
        name: 'María García',
        role: UserRole.CAREGIVER,
        patients: [],
        preferences: {
          theme: Theme.DARK,
          language: 'es' as const,
          notificationSettings: {
            enableSound: true,
            enableVibration: true,
            enablePushNotifications: true,
            priorityFilter: 'ALL' as const,
          },
          autoLogoutMinutes: 15,
        },
        lastLogin: new Date(),
        createdAt: new Date(),
      };

      const result = validateUser(user);
      expect(result.ok).toBe(false);
    });
  });

  describe('validateUserPreferences', () => {
    it('should return Ok for valid preferences', () => {
      const prefs: UserPreferences = {
        theme: Theme.DARK,
        language: 'es' as const,
        notificationSettings: {
          enableSound: true,
          enableVibration: true,
          enablePushNotifications: true,
          priorityFilter: 'ALL' as const,
        },
        autoLogoutMinutes: 15,
      };

      const result = validateUserPreferences(prefs);
      expect(result.ok).toBe(true);
    });

    it('should return Err for preferences with invalid language', () => {
      const prefs = {
        theme: Theme.DARK,
        language: 'en' as 'es',
        notificationSettings: {
          enableSound: true,
          enableVibration: true,
          enablePushNotifications: true,
          priorityFilter: 'ALL' as const,
        },
        autoLogoutMinutes: 15,
      };

      const result = validateUserPreferences(prefs);
      expect(result.ok).toBe(false);
    });

    it('should return Err for preferences with invalid autoLogoutMinutes', () => {
      const prefs = {
        theme: Theme.DARK,
        language: 'es' as const,
        notificationSettings: {
          enableSound: true,
          enableVibration: true,
          enablePushNotifications: true,
          priorityFilter: 'ALL' as const,
        },
        autoLogoutMinutes: 0,
      };

      const result = validateUserPreferences(prefs);
      expect(result.ok).toBe(false);
    });
  });
});
