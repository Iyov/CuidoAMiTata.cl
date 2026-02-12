/**
 * Unit tests for MedicationManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MedicationManager,
  getMedicationManager,
  resetMedicationManager,
} from './MedicationManager';
import { resetNotificationService } from './NotificationService';
import { ScheduleFrequency, MedicationEventStatus, Priority, NotificationType, ErrorCode } from '../types/enums';
import type { Medication, Schedule, Notification, MedicationEvent } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

// Mock IndexedDB utilities con almacenamiento en memoria
const mockStorage: Record<string, Record<string, any>> = {
  patients: {},
  medications: {},
  careEvents: {},
  notifications: {},
  syncQueue: {},
  encrypted_data: {},
};

vi.mock('../utils/indexedDB', () => ({
  STORES: {
    PATIENTS: 'patients',
    MEDICATIONS: 'medications',
    CARE_EVENTS: 'careEvents',
    NOTIFICATIONS: 'notifications',
    SYNC_QUEUE: 'syncQueue',
    ENCRYPTED_DATA: 'encrypted_data',
  },
  put: vi.fn(async (store: string, data: any) => {
    mockStorage[store][data.id] = data;
    return data;
  }),
  getById: vi.fn(async (store: string, id: string) => {
    return mockStorage[store][id];
  }),
  getByIndex: vi.fn(async (store: string, indexName: string, value: any) => {
    // Simular búsqueda por índice
    return Object.values(mockStorage[store]).filter((item: any) => {
      return item[indexName] === value;
    });
  }),
  getAll: vi.fn(async (store: string) => {
    return Object.values(mockStorage[store]);
  }),
  deleteById: vi.fn(async (store: string, id: string) => {
    delete mockStorage[store][id];
    return true;
  }),
  clear: vi.fn(async (store: string) => {
    mockStorage[store] = {};
    return true;
  }),
}));

describe('MedicationManager', () => {
  let manager: MedicationManager;

  beforeEach(() => {
    // Limpiar completamente el almacenamiento mock antes de cada prueba
    mockStorage.patients = {};
    mockStorage.medications = {};
    mockStorage.careEvents = {};
    mockStorage.notifications = {};
    mockStorage.syncQueue = {};
    mockStorage.encrypted_data = {};
    
    resetMedicationManager();
    resetNotificationService();
    manager = getMedicationManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('scheduleMedication', () => {
    it('debe programar un medicamento con horarios válidos', async () => {
      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {} as Schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: false,
        createdAt: new Date(),
      };

      const schedule: Schedule = {
        times: [new Date('2024-01-01T08:00:00'), new Date('2024-01-01T20:00:00')],
        frequency: ScheduleFrequency.DAILY,
      };

      const result = await manager.scheduleMedication(medication, schedule);

      expect(result.ok).toBe(true);
      expect(IndexedDBUtils.put).toHaveBeenCalled();
    });

    it('debe rechazar medicamento sin nombre', async () => {
      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: '',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {} as Schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: false,
        createdAt: new Date(),
      };

      const schedule: Schedule = {
        times: [new Date('2024-01-01T08:00:00')],
        frequency: ScheduleFrequency.DAILY,
      };

      const result = await manager.scheduleMedication(medication, schedule);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('nombre');
      }
    });

    it('debe rechazar medicamento sin dosis', async () => {
      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '',
        purpose: 'Anticoagulante',
        schedule: {} as Schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: false,
        createdAt: new Date(),
      };

      const schedule: Schedule = {
        times: [new Date('2024-01-01T08:00:00')],
        frequency: ScheduleFrequency.DAILY,
      };

      const result = await manager.scheduleMedication(medication, schedule);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('dosis');
      }
    });
  });

  describe('confirmAdministration', () => {
    it('debe confirmar administración dentro de la ventana de adherencia', async () => {
      const scheduledTime = new Date('2024-01-01T08:00:00');
      const actualTime = new Date('2024-01-01T08:30:00'); // 30 minutos después

      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        },
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      const medicationEvent = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime,
        status: MedicationEventStatus.PENDING,
        withinAdherenceWindow: false,
        createdAt: new Date(),
      };

      vi.mocked(IndexedDBUtils.getById).mockResolvedValue(medication);
      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue([medicationEvent]);

      const result = await manager.confirmAdministration('med-1', actualTime);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.withinWindow).toBe(true);
      }
    });

    it('debe rechazar administración fuera de la ventana de adherencia', async () => {
      const scheduledTime = new Date('2024-01-01T08:00:00');
      const actualTime = new Date('2024-01-01T11:00:00'); // 3 horas después (fuera de ventana)

      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        },
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      const medicationEvent = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime,
        status: MedicationEventStatus.PENDING,
        withinAdherenceWindow: false,
        createdAt: new Date(),
      };

      vi.mocked(IndexedDBUtils.getById).mockResolvedValue(medication);
      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue([medicationEvent]);

      const result = await manager.confirmAdministration('med-1', actualTime);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('3 horas');
      }
    });

    it('debe confirmar administración exactamente en el horario programado', async () => {
      const scheduledTime = new Date('2024-01-01T08:00:00');
      const actualTime = new Date('2024-01-01T08:00:00'); // Exacto

      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        },
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      const medicationEvent = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime,
        status: MedicationEventStatus.PENDING,
        withinAdherenceWindow: false,
        createdAt: new Date(),
      };

      vi.mocked(IndexedDBUtils.getById).mockResolvedValue(medication);
      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue([medicationEvent]);

      const result = await manager.confirmAdministration('med-1', actualTime);

      expect(result.ok).toBe(true);
    });

    it('debe confirmar administración a +1.5 horas (límite de ventana)', async () => {
      const scheduledTime = new Date('2024-01-01T08:00:00');
      const actualTime = new Date('2024-01-01T09:30:00'); // +1.5 horas

      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        },
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      const medicationEvent = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime,
        status: MedicationEventStatus.PENDING,
        withinAdherenceWindow: false,
        createdAt: new Date(),
      };

      vi.mocked(IndexedDBUtils.getById).mockResolvedValue(medication);
      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue([medicationEvent]);

      const result = await manager.confirmAdministration('med-1', actualTime);

      expect(result.ok).toBe(true);
    });

    it('debe confirmar administración a -1.5 horas (límite de ventana)', async () => {
      const scheduledTime = new Date('2024-01-01T08:00:00');
      const actualTime = new Date('2024-01-01T06:30:00'); // -1.5 horas

      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        },
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      const medicationEvent = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime,
        status: MedicationEventStatus.PENDING,
        withinAdherenceWindow: false,
        createdAt: new Date(),
      };

      vi.mocked(IndexedDBUtils.getById).mockResolvedValue(medication);
      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue([medicationEvent]);

      const result = await manager.confirmAdministration('med-1', actualTime);

      expect(result.ok).toBe(true);
    });

    it('debe rechazar administración a +2 horas (fuera de ventana)', async () => {
      const scheduledTime = new Date('2024-01-01T08:00:00');
      const actualTime = new Date('2024-01-01T10:00:00'); // +2 horas

      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        },
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      const medicationEvent = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime,
        status: MedicationEventStatus.PENDING,
        withinAdherenceWindow: false,
        createdAt: new Date(),
      };

      vi.mocked(IndexedDBUtils.getById).mockResolvedValue(medication);
      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue([medicationEvent]);

      const result = await manager.confirmAdministration('med-1', actualTime);

      expect(result.ok).toBe(false);
    });
  });

  describe('omitDose', () => {
    it('debe rechazar omisión sin justificación', async () => {
      const result = await manager.omitDose('med-1', '', new Date());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('justificación');
      }
    });

    it('debe permitir omisión con justificación válida', async () => {
      const scheduledTime = new Date('2024-01-01T08:00:00');
      const omitTime = new Date('2024-01-01T08:00:00');

      const medication: Medication = {
        id: 'med-1',
        patientId: 'patient-1',
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule: {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        },
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
        isActive: true,
        createdAt: new Date(),
      };

      const medicationEvent = {
        id: 'event-1',
        medicationId: 'med-1',
        patientId: 'patient-1',
        scheduledTime,
        status: MedicationEventStatus.PENDING,
        withinAdherenceWindow: false,
        createdAt: new Date(),
      };

      vi.mocked(IndexedDBUtils.getById).mockResolvedValue(medication);
      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue([medicationEvent]);

      const result = await manager.omitDose(
        'med-1',
        'Paciente rechazó la medicación',
        omitTime
      );

      expect(result.ok).toBe(true);
      expect(IndexedDBUtils.put).toHaveBeenCalled();
    });

    it('debe rechazar omisión con justificación vacía (solo espacios)', async () => {
      const result = await manager.omitDose('med-1', '   ', new Date());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('justificación');
      }
    });
  });

  describe('getMedicationSheet', () => {
    it('debe devolver hoja de medicamentos para un paciente específico', async () => {
      const medications: Medication[] = [
        {
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
        },
      ];

      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue(medications);

      const sheet = await manager.getMedicationSheet('patient-1');

      expect(sheet.patientId).toBe('patient-1');
      expect(sheet.medications).toHaveLength(1);
      expect(sheet.medications[0].name).toBe('Aspirina');
    });

    it('debe devolver solo medicamentos activos', async () => {
      const medications: Medication[] = [
        {
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
        },
        {
          id: 'med-2',
          patientId: 'patient-1',
          name: 'Ibuprofeno',
          dosage: '200mg',
          purpose: 'Analgésico',
          schedule: {
            times: [new Date()],
            frequency: ScheduleFrequency.DAILY,
          },
          stockLevel: 20,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        },
      ];

      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue(medications);

      const sheet = await manager.getMedicationSheet('patient-1');

      expect(sheet.medications).toHaveLength(1);
      expect(sheet.medications[0].name).toBe('Aspirina');
    });

    it('debe devolver hoja vacía si no hay medicamentos', async () => {
      vi.mocked(IndexedDBUtils.getByIndex).mockResolvedValue([]);

      const sheet = await manager.getMedicationSheet('patient-1');

      expect(sheet.medications).toHaveLength(0);
    });
  });

  describe('checkAdherenceWindow', () => {
    it('debe validar correctamente la ventana de adherencia', () => {
      const scheduledTime = new Date('2024-01-01T08:00:00');
      const actualTime = new Date('2024-01-01T08:30:00');

      const result = manager.checkAdherenceWindow(scheduledTime, actualTime);

      expect(result).toBe(true);
    });

    it('debe rechazar tiempo fuera de la ventana', () => {
      const scheduledTime = new Date('2024-01-01T08:00:00');
      const actualTime = new Date('2024-01-01T11:00:00');

      const result = manager.checkAdherenceWindow(scheduledTime, actualTime);

      expect(result).toBe(false);
    });
  });

  describe('Property-Based Tests', () => {
    describe('Propiedad 1: Emisión de alertas duales en horarios programados', () => {
      it('debe emitir alertas duales para todos los medicamentos programados', async () => {
        // Feature: cuido-a-mi-tata, Property 1: Emisión de alertas duales en horarios programados
        // Valida: Requisitos 1.1

        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            // Generador de medicamentos con horarios programados
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              name: fc.string({ minLength: 3, maxLength: 50 }),
              dosage: fc.string({ minLength: 2, maxLength: 20 }),
              purpose: fc.string({ minLength: 5, maxLength: 100 }),
              stockLevel: fc.integer({ min: 1, max: 100 }),
              expirationDate: fc.date({ min: new Date(), max: new Date('2030-12-31') }),
              // Generar 1-5 horarios de medicación
              scheduleTimes: fc.array(
                fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
                { minLength: 1, maxLength: 5 }
              ),
            }),
            async (medicationData) => {
              const medication: Medication = {
                id: medicationData.id,
                patientId: medicationData.patientId,
                name: medicationData.name,
                dosage: medicationData.dosage,
                purpose: medicationData.purpose,
                schedule: {} as Schedule,
                stockLevel: medicationData.stockLevel,
                expirationDate: medicationData.expirationDate,
                isActive: false,
                createdAt: new Date(),
              };

              const schedule: Schedule = {
                times: medicationData.scheduleTimes,
                frequency: ScheduleFrequency.DAILY,
              };

              // Espiar el método scheduleNotification del NotificationService
              const notificationService = await import('./NotificationService').then(
                (m) => m.getNotificationService()
              );
              const scheduleNotificationSpy = vi.spyOn(notificationService, 'scheduleNotification');

              // Programar el medicamento
              const result = await manager.scheduleMedication(medication, schedule);

              // Verificar que la programación fue exitosa
              expect(result.ok).toBe(true);

              // Verificar que se programó una notificación para cada horario
              expect(scheduleNotificationSpy).toHaveBeenCalledTimes(schedule.times.length);

              // Verificar que TODAS las notificaciones tienen isDualAlert = true
              for (let i = 0; i < schedule.times.length; i++) {
                const call = scheduleNotificationSpy.mock.calls[i];
                const notification = call[0] as Notification;

                // Propiedad 1: Todas las alertas de medicación deben ser duales
                expect(notification.isDualAlert).toBe(true);

                // Verificar que el horario programado coincide
                expect(notification.scheduledTime.getTime()).toBe(schedule.times[i].getTime());

                // Verificar que el tipo es MEDICATION
                expect(notification.type).toBe(NotificationType.MEDICATION);

                // Verificar que la prioridad es alta (medicamentos son críticos)
                expect(notification.priority).toBe(Priority.HIGH);

                // Verificar que el mensaje contiene el nombre y dosis del medicamento
                expect(notification.message).toContain(medication.name);
                expect(notification.message).toContain(medication.dosage);
              }

              // Limpiar
              scheduleNotificationSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, medication.id);

              // Limpiar notificaciones creadas
              for (const time of schedule.times) {
                const notificationId = `med-${medication.id}-${time.getTime()}`;
                await IndexedDBUtils.deleteById(
                  IndexedDBUtils.STORES.NOTIFICATIONS,
                  notificationId
                );
              }

              return true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe emitir alertas duales independientemente del número de horarios', async () => {
        // Verifica que la propiedad se mantiene con diferentes cantidades de horarios

        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              name: fc.string({ minLength: 3, maxLength: 50 }),
              dosage: fc.string({ minLength: 2, maxLength: 20 }),
              purpose: fc.string({ minLength: 5, maxLength: 100 }),
              stockLevel: fc.integer({ min: 1, max: 100 }),
              expirationDate: fc.date({ min: new Date(), max: new Date('2030-12-31') }),
              // Variar el número de horarios de 1 a 10
              numSchedules: fc.integer({ min: 1, max: 10 }),
            }),
            async (medicationData) => {
              // Generar horarios basados en numSchedules
              const scheduleTimes: Date[] = [];
              const baseDate = new Date('2024-01-01T08:00:00');
              for (let i = 0; i < medicationData.numSchedules; i++) {
                const time = new Date(baseDate.getTime() + i * 3600000); // Cada hora
                scheduleTimes.push(time);
              }

              const medication: Medication = {
                id: medicationData.id,
                patientId: medicationData.patientId,
                name: medicationData.name,
                dosage: medicationData.dosage,
                purpose: medicationData.purpose,
                schedule: {} as Schedule,
                stockLevel: medicationData.stockLevel,
                expirationDate: medicationData.expirationDate,
                isActive: false,
                createdAt: new Date(),
              };

              const schedule: Schedule = {
                times: scheduleTimes,
                frequency: ScheduleFrequency.DAILY,
              };

              const notificationService = await import('./NotificationService').then(
                (m) => m.getNotificationService()
              );
              const scheduleNotificationSpy = vi.spyOn(notificationService, 'scheduleNotification');

              await manager.scheduleMedication(medication, schedule);

              // Verificar que todas las notificaciones son duales
              const allAreDualAlerts = scheduleNotificationSpy.mock.calls.every((call) => {
                const notification = call[0] as Notification;
                return notification.isDualAlert === true;
              });

              expect(allAreDualAlerts).toBe(true);
              expect(scheduleNotificationSpy).toHaveBeenCalledTimes(medicationData.numSchedules);

              // Limpiar
              scheduleNotificationSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, medication.id);

              for (const time of scheduleTimes) {
                const notificationId = `med-${medication.id}-${time.getTime()}`;
                await IndexedDBUtils.deleteById(
                  IndexedDBUtils.STORES.NOTIFICATIONS,
                  notificationId
                );
              }

              return true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe emitir alertas duales para diferentes tipos de medicamentos', async () => {
        // Verifica que la propiedad se mantiene independientemente del tipo de medicamento

        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              // Diferentes tipos de medicamentos
              name: fc.oneof(
                fc.constant('Aspirina'),
                fc.constant('Ibuprofeno'),
                fc.constant('Paracetamol'),
                fc.constant('Omeprazol'),
                fc.constant('Metformina'),
                fc.string({ minLength: 3, maxLength: 50 })
              ),
              dosage: fc.oneof(
                fc.constant('100mg'),
                fc.constant('500mg'),
                fc.constant('1g'),
                fc.constant('5ml'),
                fc.string({ minLength: 2, maxLength: 20 })
              ),
              purpose: fc.oneof(
                fc.constant('Anticoagulante'),
                fc.constant('Analgésico'),
                fc.constant('Antiinflamatorio'),
                fc.constant('Protector gástrico'),
                fc.constant('Antidiabético'),
                fc.string({ minLength: 5, maxLength: 100 })
              ),
              stockLevel: fc.integer({ min: 1, max: 100 }),
              expirationDate: fc.date({ min: new Date(), max: new Date('2030-12-31') }),
              scheduleTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            }),
            async (medicationData) => {
              const medication: Medication = {
                id: medicationData.id,
                patientId: medicationData.patientId,
                name: medicationData.name,
                dosage: medicationData.dosage,
                purpose: medicationData.purpose,
                schedule: {} as Schedule,
                stockLevel: medicationData.stockLevel,
                expirationDate: medicationData.expirationDate,
                isActive: false,
                createdAt: new Date(),
              };

              const schedule: Schedule = {
                times: [medicationData.scheduleTime],
                frequency: ScheduleFrequency.DAILY,
              };

              const notificationService = await import('./NotificationService').then(
                (m) => m.getNotificationService()
              );
              const scheduleNotificationSpy = vi.spyOn(notificationService, 'scheduleNotification');

              await manager.scheduleMedication(medication, schedule);

              // Verificar que la notificación es dual
              expect(scheduleNotificationSpy).toHaveBeenCalledTimes(1);
              const notification = scheduleNotificationSpy.mock.calls[0][0] as Notification;
              expect(notification.isDualAlert).toBe(true);

              // Limpiar
              scheduleNotificationSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, medication.id);

              const notificationId = `med-${medication.id}-${medicationData.scheduleTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notificationId);

              return true;
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Propiedad 4: Justificación obligatoria para acciones críticas', () => {
      it('debe bloquear omisión de dosis sin justificación y permitir con justificación válida', async () => {
        // Feature: cuido-a-mi-tata, Property 4: Justificación obligatoria para acciones críticas
        // Valida: Requisitos 1.5, 6.6, 7.5

        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            // Generador de medicamentos y justificaciones
            fc.record({
              medicationId: fc.uuid(),
              patientId: fc.uuid(),
              medicationName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
              dosage: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2),
              purpose: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
              scheduledTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              // Generar justificación opcional (undefined, vacía, solo espacios, o válida)
              justification: fc.oneof(
                fc.constant(undefined),
                fc.constant(''),
                fc.constant('   '),
                fc.constant('\t\n'),
                fc.string({ minLength: 10, maxLength: 200 })
              ),
            }),
            async (data) => {
              // Crear medicamento
              const medication: Medication = {
                id: data.medicationId,
                patientId: data.patientId,
                name: data.medicationName,
                dosage: data.dosage,
                purpose: data.purpose,
                schedule: {} as Schedule,
                stockLevel: 30,
                expirationDate: new Date('2025-12-31'),
                isActive: false,
                createdAt: new Date(),
              };

              const schedule: Schedule = {
                times: [data.scheduledTime],
                frequency: ScheduleFrequency.DAILY,
              };

              // Programar el medicamento (esto crea el evento automáticamente con el ID correcto)
              const scheduleResult = await manager.scheduleMedication(medication, schedule);
              expect(scheduleResult.ok).toBe(true);

              // Intentar omitir dosis con la justificación generada
              const omitTime = new Date(data.scheduledTime.getTime() + 1000);
              const result = await manager.omitDose(
                data.medicationId,
                data.justification as string,
                omitTime
              );

              // Determinar si la justificación es válida
              const isJustificationValid =
                data.justification !== undefined &&
                data.justification.trim().length > 0;

              // Propiedad 4: Sin justificación válida → debe fallar con error específico
              // Con justificación válida → debe tener éxito
              if (!isJustificationValid) {
                // Debe rechazar la omisión
                expect(result.ok).toBe(false);
                if (!result.ok) {
                  expect(result.error.code).toBe(ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED);
                  expect(result.error.message).toContain('justificación');
                }
              } else {
                // Debe permitir la omisión
                expect(result.ok).toBe(true);
              }

              // Limpiar
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, data.medicationId);
              const eventId = `event-${data.medicationId}-${data.scheduledTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.CARE_EVENTS, eventId);
              const notificationId = `med-${data.medicationId}-${data.scheduledTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notificationId);

              return true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe rechazar justificaciones que solo contienen espacios en blanco', async () => {
        // Verifica que justificaciones con solo espacios, tabs, newlines son rechazadas

        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.record({
              medicationId: fc.uuid(),
              patientId: fc.uuid(),
              medicationName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
              dosage: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2),
              purpose: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
              scheduledTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              // Generar diferentes tipos de espacios en blanco
              whitespaceType: fc.constantFrom(
                ' ',
                '  ',
                '   ',
                '\t',
                '\n',
                '\r\n',
                ' \t\n ',
                '     \t\t\n\n     '
              ),
            }),
            async (data) => {
              const medication: Medication = {
                id: data.medicationId,
                patientId: data.patientId,
                name: data.medicationName,
                dosage: data.dosage,
                purpose: data.purpose,
                schedule: {} as Schedule,
                stockLevel: 30,
                expirationDate: new Date('2025-12-31'),
                isActive: false,
                createdAt: new Date(),
              };

              const schedule: Schedule = {
                times: [data.scheduledTime],
                frequency: ScheduleFrequency.DAILY,
              };

              // Programar el medicamento
              await manager.scheduleMedication(medication, schedule);

              // Intentar omitir con solo espacios en blanco
              const omitTime = new Date(data.scheduledTime.getTime() + 1000);
              const result = await manager.omitDose(
                data.medicationId,
                data.whitespaceType,
                omitTime
              );

              // Debe rechazar
              expect(result.ok).toBe(false);
              if (!result.ok) {
                expect(result.error.code).toBe(ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED);
              }

              // Limpiar
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, data.medicationId);
              const eventId = `event-${data.medicationId}-${data.scheduledTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.CARE_EVENTS, eventId);
              const notificationId = `med-${data.medicationId}-${data.scheduledTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notificationId);

              return true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe aceptar cualquier justificación con contenido textual válido', async () => {
        // Verifica que cualquier texto no vacío es aceptado como justificación

        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.record({
              medicationId: fc.uuid(),
              patientId: fc.uuid(),
              medicationName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
              dosage: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2),
              purpose: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
              scheduledTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              // Generar diferentes tipos de justificaciones válidas
              justification: fc.oneof(
                fc.constant('Paciente rechazó la medicación'),
                fc.constant('Paciente dormido'),
                fc.constant('Náuseas'),
                fc.constant('Indicación médica'),
                fc.constant('Efectos secundarios'),
                fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0)
              ),
            }),
            async (data) => {
              const medication: Medication = {
                id: data.medicationId,
                patientId: data.patientId,
                name: data.medicationName,
                dosage: data.dosage,
                purpose: data.purpose,
                schedule: {} as Schedule,
                stockLevel: 30,
                expirationDate: new Date('2025-12-31'),
                isActive: false,
                createdAt: new Date(),
              };

              const schedule: Schedule = {
                times: [data.scheduledTime],
                frequency: ScheduleFrequency.DAILY,
              };

              // Programar el medicamento
              await manager.scheduleMedication(medication, schedule);

              // Intentar omitir con justificación válida
              const omitTime = new Date(data.scheduledTime.getTime() + 1000);
              const result = await manager.omitDose(
                data.medicationId,
                data.justification,
                omitTime
              );

              // Debe aceptar
              expect(result.ok).toBe(true);

              // Limpiar
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, data.medicationId);
              const eventId = `event-${data.medicationId}-${data.scheduledTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.CARE_EVENTS, eventId);
              const notificationId = `med-${data.medicationId}-${data.scheduledTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notificationId);

              return true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe mantener la propiedad independientemente del tipo de medicamento', async () => {
        // Verifica que la justificación obligatoria aplica a todos los medicamentos

        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.record({
              medicationId: fc.uuid(),
              patientId: fc.uuid(),
              // Diferentes tipos de medicamentos
              medicationType: fc.constantFrom(
                { name: 'Aspirina', dosage: '100mg', purpose: 'Anticoagulante' },
                { name: 'Ibuprofeno', dosage: '400mg', purpose: 'Analgésico' },
                { name: 'Omeprazol', dosage: '20mg', purpose: 'Protector gástrico' },
                { name: 'Metformina', dosage: '850mg', purpose: 'Antidiabético' },
                { name: 'Enalapril', dosage: '10mg', purpose: 'Antihipertensivo' }
              ),
              scheduledTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              hasJustification: fc.boolean(),
            }),
            async (data) => {
              const medication: Medication = {
                id: data.medicationId,
                patientId: data.patientId,
                name: data.medicationType.name,
                dosage: data.medicationType.dosage,
                purpose: data.medicationType.purpose,
                schedule: {} as Schedule,
                stockLevel: 30,
                expirationDate: new Date('2025-12-31'),
                isActive: false,
                createdAt: new Date(),
              };

              const schedule: Schedule = {
                times: [data.scheduledTime],
                frequency: ScheduleFrequency.DAILY,
              };

              // Programar el medicamento
              await manager.scheduleMedication(medication, schedule);

              const justification = data.hasJustification
                ? 'Justificación válida para omitir dosis'
                : '';

              const omitTime = new Date(data.scheduledTime.getTime() + 1000);
              const result = await manager.omitDose(
                data.medicationId,
                justification,
                omitTime
              );

              // La propiedad debe mantenerse independientemente del tipo de medicamento
              if (data.hasJustification) {
                expect(result.ok).toBe(true);
              } else {
                expect(result.ok).toBe(false);
                if (!result.ok) {
                  expect(result.error.code).toBe(ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED);
                }
              }

              // Limpiar
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, data.medicationId);
              const eventId = `event-${data.medicationId}-${data.scheduledTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.CARE_EVENTS, eventId);
              const notificationId = `med-${data.medicationId}-${data.scheduledTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notificationId);

              return true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe bloquear completamente la operación sin justificación (no debe modificar estado)', async () => {
        // Verifica que sin justificación, el sistema no modifica ningún estado

        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.record({
              medicationId: fc.uuid(),
              patientId: fc.uuid(),
              medicationName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
              dosage: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length >= 2),
              purpose: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
              scheduledTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            }),
            async (data) => {
              const medication: Medication = {
                id: data.medicationId,
                patientId: data.patientId,
                name: data.medicationName,
                dosage: data.dosage,
                purpose: data.purpose,
                schedule: {} as Schedule,
                stockLevel: 30,
                expirationDate: new Date('2025-12-31'),
                isActive: false,
                createdAt: new Date(),
              };

              const schedule: Schedule = {
                times: [data.scheduledTime],
                frequency: ScheduleFrequency.DAILY,
              };

              // Programar el medicamento
              await manager.scheduleMedication(medication, schedule);

              // Capturar estado antes de intentar omitir
              const eventId = `event-${data.medicationId}-${data.scheduledTime.getTime()}`;
              const eventBefore = await IndexedDBUtils.getById<MedicationEvent>(
                IndexedDBUtils.STORES.CARE_EVENTS,
                eventId
              );

              // Intentar omitir sin justificación
              const omitTime = new Date(data.scheduledTime.getTime() + 1000);
              const result = await manager.omitDose(data.medicationId, '', omitTime);

              // Debe fallar
              expect(result.ok).toBe(false);

              // Verificar que el estado NO cambió
              const eventAfter = await IndexedDBUtils.getById<MedicationEvent>(
                IndexedDBUtils.STORES.CARE_EVENTS,
                eventId
              );

              expect(eventAfter?.status).toBe(eventBefore?.status);
              expect(eventAfter?.status).toBe(MedicationEventStatus.PENDING);
              expect(eventAfter?.justification).toBeUndefined();
              expect(eventAfter?.actualTime).toBeUndefined();

              // Limpiar
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, data.medicationId);
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.CARE_EVENTS, eventId);
              const notificationId = `med-${data.medicationId}-${data.scheduledTime.getTime()}`;
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notificationId);

              return true;
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('Flujo de medicación completo (Task 7.4)', () => {
    describe('Programar → alertar → confirmar → registrar', () => {
      it('debe completar el flujo completo de medicación exitosamente', async () => {
        // Requisitos: 1.1, 1.3, 1.4
        const scheduledTime = new Date(Date.now() + 60000); // 1 minuto en el futuro
        const confirmTime = new Date(scheduledTime.getTime() + 900000); // 15 minutos después

        const medication: Medication = {
          id: 'med-flow-1',
          patientId: 'patient-1',
          name: 'Aspirina',
          dosage: '100mg',
          purpose: 'Anticoagulante',
          schedule: {} as Schedule,
          stockLevel: 30,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        };

        const schedule: Schedule = {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        };

        // Paso 1: Programar medicamento
        const scheduleResult = await manager.scheduleMedication(medication, schedule);
        expect(scheduleResult.ok).toBe(true);

        // Verificar que el medicamento está activo
        const savedMedication = await IndexedDBUtils.getById<Medication>(
          IndexedDBUtils.STORES.MEDICATIONS,
          'med-flow-1'
        );
        expect(savedMedication?.isActive).toBe(true);

        // Paso 2: Verificar que se creó la alerta (notificación)
        const notificationId = `med-med-flow-1-${scheduledTime.getTime()}`;
        const notification = await IndexedDBUtils.getById<Notification>(
          IndexedDBUtils.STORES.NOTIFICATIONS,
          notificationId
        );
        expect(notification).toBeDefined();
        expect(notification?.isDualAlert).toBe(true);
        expect(notification?.type).toBe(NotificationType.MEDICATION);

        // Paso 3: Verificar que se creó el evento
        const eventId = `event-med-flow-1-${scheduledTime.getTime()}`;
        const eventBefore = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          eventId
        );
        expect(eventBefore).toBeDefined();
        expect(eventBefore?.scheduledTime.getTime()).toBe(scheduledTime.getTime());

        // Paso 4: Confirmar administración
        const confirmResult = await manager.confirmAdministration('med-flow-1', confirmTime);
        expect(confirmResult.ok).toBe(true);
        if (confirmResult.ok) {
          expect(confirmResult.value.withinWindow).toBe(true);
        }

        // Paso 5: Verificar que el evento fue registrado correctamente
        const eventAfter = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          eventId
        );
        expect(eventAfter?.status).toBe(MedicationEventStatus.CONFIRMED);
        expect(eventAfter?.actualTime).toBeDefined();
        expect(eventAfter?.withinAdherenceWindow).toBe(true);
        expect(eventAfter?.actualTime?.getTime()).toBe(confirmTime.getTime());
      });

      it('debe completar el flujo con múltiples horarios programados', async () => {
        // Requisitos: 1.1, 1.3, 1.4
        const scheduledTime1 = new Date(Date.now() + 60000); // 1 minuto en el futuro
        const scheduledTime2 = new Date(Date.now() + 120000); // 2 minutos en el futuro
        const confirmTime1 = new Date(scheduledTime1.getTime() + 1200000); // 20 minutos después
        const confirmTime2 = new Date(scheduledTime2.getTime() + 600000); // 10 minutos después

        const medication: Medication = {
          id: 'med-flow-2',
          patientId: 'patient-1',
          name: 'Metformina',
          dosage: '850mg',
          purpose: 'Antidiabético',
          schedule: {} as Schedule,
          stockLevel: 60,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        };

        const schedule: Schedule = {
          times: [scheduledTime1, scheduledTime2],
          frequency: ScheduleFrequency.DAILY,
        };

        // Programar medicamento con 2 horarios
        const scheduleResult = await manager.scheduleMedication(medication, schedule);
        expect(scheduleResult.ok).toBe(true);

        // Verificar que se crearon 2 notificaciones
        const notification1 = await IndexedDBUtils.getById<Notification>(
          IndexedDBUtils.STORES.NOTIFICATIONS,
          `med-med-flow-2-${scheduledTime1.getTime()}`
        );
        const notification2 = await IndexedDBUtils.getById<Notification>(
          IndexedDBUtils.STORES.NOTIFICATIONS,
          `med-med-flow-2-${scheduledTime2.getTime()}`
        );
        expect(notification1).toBeDefined();
        expect(notification2).toBeDefined();

        // Verificar que se crearon 2 eventos
        const event1Before = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          `event-med-flow-2-${scheduledTime1.getTime()}`
        );
        const event2Before = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          `event-med-flow-2-${scheduledTime2.getTime()}`
        );
        expect(event1Before).toBeDefined();
        expect(event2Before).toBeDefined();

        // Confirmar primera dosis
        const confirmResult1 = await manager.confirmAdministration('med-flow-2', confirmTime1);
        expect(confirmResult1.ok).toBe(true);

        // Confirmar segunda dosis
        const confirmResult2 = await manager.confirmAdministration('med-flow-2', confirmTime2);
        expect(confirmResult2.ok).toBe(true);

        // Verificar que ambos eventos fueron confirmados
        const event1After = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          `event-med-flow-2-${scheduledTime1.getTime()}`
        );
        const event2After = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          `event-med-flow-2-${scheduledTime2.getTime()}`
        );
        expect(event1After?.status).toBe(MedicationEventStatus.CONFIRMED);
        expect(event2After?.status).toBe(MedicationEventStatus.CONFIRMED);
      });

      it('debe registrar marca temporal en cada paso del flujo', async () => {
        // Requisito: 1.2, 1.4
        const scheduledTime = new Date('2024-01-01T08:00:00');
        const confirmTime = new Date('2024-01-01T08:25:00');

        const medication: Medication = {
          id: 'med-flow-3',
          patientId: 'patient-1',
          name: 'Omeprazol',
          dosage: '20mg',
          purpose: 'Protector gástrico',
          schedule: {} as Schedule,
          stockLevel: 30,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        };

        const schedule: Schedule = {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        };

        // Programar
        await manager.scheduleMedication(medication, schedule);

        // Verificar marca temporal en notificación
        const notification = await IndexedDBUtils.getById<Notification>(
          IndexedDBUtils.STORES.NOTIFICATIONS,
          `med-med-flow-3-${scheduledTime.getTime()}`
        );
        expect(notification?.createdAt).toBeDefined();
        expect(notification?.scheduledTime.getTime()).toBe(scheduledTime.getTime());

        // Verificar marca temporal en evento inicial
        const eventId = `event-med-flow-3-${scheduledTime.getTime()}`;
        const eventBefore = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          eventId
        );
        expect(eventBefore?.createdAt).toBeDefined();
        expect(eventBefore?.scheduledTime.getTime()).toBe(scheduledTime.getTime());

        // Confirmar
        await manager.confirmAdministration('med-flow-3', confirmTime);

        // Verificar marca temporal de confirmación
        const eventAfter = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          eventId
        );
        expect(eventAfter?.actualTime).toBeDefined();
        expect(eventAfter?.actualTime?.getTime()).toBe(confirmTime.getTime());
      });
    });

    describe('Omitir sin justificación → bloqueado', () => {
      it('debe bloquear omisión sin justificación', async () => {
        // Requisito: 1.5
        const scheduledTime = new Date('2024-01-01T08:00:00');
        const omitTime = new Date('2024-01-01T08:00:00');

        const medication: Medication = {
          id: 'med-omit-1',
          patientId: 'patient-1',
          name: 'Enalapril',
          dosage: '10mg',
          purpose: 'Antihipertensivo',
          schedule: {} as Schedule,
          stockLevel: 30,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        };

        const schedule: Schedule = {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        };

        // Programar medicamento
        await manager.scheduleMedication(medication, schedule);

        // Intentar omitir sin justificación
        const result = await manager.omitDose('med-omit-1', '', omitTime);

        // Debe estar bloqueado
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED);
          expect(result.error.message).toContain('justificación');
        }

        // Verificar que el evento sigue pendiente (no se modificó)
        const eventId = `event-med-omit-1-${scheduledTime.getTime()}`;
        const event = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          eventId
        );
        expect(event?.status).toBe(MedicationEventStatus.PENDING);
        expect(event?.justification).toBeUndefined();
      });

      it('debe bloquear omisión con justificación vacía (solo espacios)', async () => {
        // Requisito: 1.5
        const scheduledTime = new Date('2024-01-01T08:00:00');
        const omitTime = new Date('2024-01-01T08:00:00');

        const medication: Medication = {
          id: 'med-omit-2',
          patientId: 'patient-1',
          name: 'Simvastatina',
          dosage: '20mg',
          purpose: 'Hipolipemiante',
          schedule: {} as Schedule,
          stockLevel: 30,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        };

        const schedule: Schedule = {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        };

        // Programar medicamento
        await manager.scheduleMedication(medication, schedule);

        // Intentar omitir con solo espacios
        const result = await manager.omitDose('med-omit-2', '   ', omitTime);

        // Debe estar bloqueado
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED);
        }

        // Verificar que el evento sigue pendiente
        const eventId = `event-med-omit-2-${scheduledTime.getTime()}`;
        const event = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          eventId
        );
        expect(event?.status).toBe(MedicationEventStatus.PENDING);
      });

      it('debe bloquear omisión con justificación undefined', async () => {
        // Requisito: 1.5
        const scheduledTime = new Date('2024-01-01T08:00:00');
        const omitTime = new Date('2024-01-01T08:00:00');

        const medication: Medication = {
          id: 'med-omit-3',
          patientId: 'patient-1',
          name: 'Losartán',
          dosage: '50mg',
          purpose: 'Antihipertensivo',
          schedule: {} as Schedule,
          stockLevel: 30,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        };

        const schedule: Schedule = {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        };

        // Programar medicamento
        await manager.scheduleMedication(medication, schedule);

        // Intentar omitir con undefined
        const result = await manager.omitDose('med-omit-3', undefined as any, omitTime);

        // Debe estar bloqueado
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED);
        }
      });
    });

    describe('Omitir con justificación → permitido', () => {
      it('debe permitir omisión con justificación válida', async () => {
        // Requisito: 1.5
        const scheduledTime = new Date('2024-01-01T08:00:00');
        const omitTime = new Date('2024-01-01T08:00:00');

        const medication: Medication = {
          id: 'med-omit-valid-1',
          patientId: 'patient-1',
          name: 'Amlodipino',
          dosage: '5mg',
          purpose: 'Antihipertensivo',
          schedule: {} as Schedule,
          stockLevel: 30,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        };

        const schedule: Schedule = {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        };

        // Programar medicamento
        await manager.scheduleMedication(medication, schedule);

        // Omitir con justificación válida
        const justification = 'Paciente rechazó la medicación';
        const result = await manager.omitDose('med-omit-valid-1', justification, omitTime);

        // Debe estar permitido
        expect(result.ok).toBe(true);

        // Verificar que el evento fue actualizado correctamente
        const eventId = `event-med-omit-valid-1-${scheduledTime.getTime()}`;
        const event = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          eventId
        );
        expect(event?.status).toBe(MedicationEventStatus.OMITTED);
        expect(event?.justification).toBe(justification);
        expect(event?.actualTime).toBeDefined();
        expect(event?.actualTime?.getTime()).toBe(omitTime.getTime());
      });

      it('debe permitir omisión con diferentes justificaciones válidas', async () => {
        // Requisito: 1.5
        const justifications = [
          'Paciente dormido',
          'Náuseas',
          'Indicación médica',
          'Efectos secundarios adversos',
          'Paciente en ayunas para procedimiento',
        ];

        for (let i = 0; i < justifications.length; i++) {
          const scheduledTime = new Date('2024-01-01T08:00:00');
          const omitTime = new Date('2024-01-01T08:00:00');
          const medId = `med-omit-valid-${i + 2}`;

          const medication: Medication = {
            id: medId,
            patientId: 'patient-1',
            name: `Medicamento ${i + 1}`,
            dosage: '10mg',
            purpose: 'Tratamiento',
            schedule: {} as Schedule,
            stockLevel: 30,
            expirationDate: new Date('2025-12-31'),
            isActive: false,
            createdAt: new Date(),
          };

          const schedule: Schedule = {
            times: [scheduledTime],
            frequency: ScheduleFrequency.DAILY,
          };

          // Programar medicamento
          await manager.scheduleMedication(medication, schedule);

          // Omitir con justificación
          const result = await manager.omitDose(medId, justifications[i], omitTime);

          // Debe estar permitido
          expect(result.ok).toBe(true);

          // Verificar que la justificación fue guardada
          const eventId = `event-${medId}-${scheduledTime.getTime()}`;
          const event = await IndexedDBUtils.getById<MedicationEvent>(
            IndexedDBUtils.STORES.CARE_EVENTS,
            eventId
          );
          expect(event?.justification).toBe(justifications[i]);
        }
      });

      it('debe registrar marca temporal al omitir con justificación', async () => {
        // Requisito: 1.4, 1.5
        const scheduledTime = new Date('2024-01-01T08:00:00');
        const omitTime = new Date('2024-01-01T08:15:00');

        const medication: Medication = {
          id: 'med-omit-valid-7',
          patientId: 'patient-1',
          name: 'Levotiroxina',
          dosage: '100mcg',
          purpose: 'Hipotiroidismo',
          schedule: {} as Schedule,
          stockLevel: 30,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        };

        const schedule: Schedule = {
          times: [scheduledTime],
          frequency: ScheduleFrequency.DAILY,
        };

        // Programar medicamento
        await manager.scheduleMedication(medication, schedule);

        // Omitir con justificación
        const justification = 'Paciente en ayunas';
        await manager.omitDose('med-omit-valid-7', justification, omitTime);

        // Verificar marca temporal
        const eventId = `event-med-omit-valid-7-${scheduledTime.getTime()}`;
        const event = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          eventId
        );
        expect(event?.actualTime).toBeDefined();
        expect(event?.actualTime?.getTime()).toBe(omitTime.getTime());
        expect(event?.createdAt).toBeDefined();
      });

      it('debe permitir omitir múltiples dosis con justificaciones diferentes', async () => {
        // Requisito: 1.5
        const scheduledTime1 = new Date('2024-01-01T08:00:00');
        const scheduledTime2 = new Date('2024-01-01T20:00:00');
        const omitTime1 = new Date('2024-01-01T08:00:00');
        const omitTime2 = new Date('2024-01-01T20:00:00');

        const medication: Medication = {
          id: 'med-omit-valid-8',
          patientId: 'patient-1',
          name: 'Furosemida',
          dosage: '40mg',
          purpose: 'Diurético',
          schedule: {} as Schedule,
          stockLevel: 60,
          expirationDate: new Date('2025-12-31'),
          isActive: false,
          createdAt: new Date(),
        };

        const schedule: Schedule = {
          times: [scheduledTime1, scheduledTime2],
          frequency: ScheduleFrequency.DAILY,
        };

        // Programar medicamento con 2 horarios
        await manager.scheduleMedication(medication, schedule);

        // Omitir primera dosis
        const result1 = await manager.omitDose(
          'med-omit-valid-8',
          'Paciente dormido',
          omitTime1
        );
        expect(result1.ok).toBe(true);

        // Omitir segunda dosis
        const result2 = await manager.omitDose(
          'med-omit-valid-8',
          'Náuseas persistentes',
          omitTime2
        );
        expect(result2.ok).toBe(true);

        // Verificar que ambas dosis fueron omitidas con sus justificaciones
        const event1 = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          `event-med-omit-valid-8-${scheduledTime1.getTime()}`
        );
        const event2 = await IndexedDBUtils.getById<MedicationEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          `event-med-omit-valid-8-${scheduledTime2.getTime()}`
        );

        expect(event1?.status).toBe(MedicationEventStatus.OMITTED);
        expect(event1?.justification).toBe('Paciente dormido');
        expect(event2?.status).toBe(MedicationEventStatus.OMITTED);
        expect(event2?.justification).toBe('Náuseas persistentes');
      });
    });
  });
});
