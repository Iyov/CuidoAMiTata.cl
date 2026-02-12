/**
 * Pruebas para NotificationService
 * Incluye pruebas basadas en propiedades y pruebas unitarias
 */

import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { NotificationService, getNotificationService, resetNotificationService } from './NotificationService';
import { ErrorCode, Priority, NotificationStatus } from '../types/enums';
import type { Notification } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';
import { isOk, isErr } from '../types/result';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    // Limpiar estado antes de cada prueba
    resetNotificationService();
    
    // Limpiar stores de IndexedDB
    try {
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
    } catch (error) {
      // Ignorar errores si los stores no existen aún
    }

    service = await getNotificationService();
  });

  afterEach(() => {
    resetNotificationService();
    vi.restoreAllMocks();
  });

  describe('Property-Based Tests', () => {
    describe('Propiedad 28: Precisión temporal de notificaciones', () => {
      it('debe emitir notificaciones dentro de ±30 segundos del momento programado', async () => {
        // Feature: cuido-a-mi-tata, Property 28: Precisión temporal de notificaciones
        // Valida: Requisitos 11.1
        
        await fc.assert(
          fc.asyncProperty(
            // Generador de notificaciones con diferentes tiempos de programación
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              // Programar notificaciones en el futuro cercano (10ms a 50ms para pruebas rápidas)
              delayMs: fc.integer({ min: 10, max: 50 }),
              isDualAlert: fc.boolean(),
            }),
            async (notificationData) => {
              // Calcular tiempo programado
              const now = Date.now();
              const scheduledTime = new Date(now + notificationData.delayMs);
              
              const notification: Notification = {
                id: notificationData.id,
                patientId: notificationData.patientId,
                type: notificationData.type as any,
                priority: notificationData.priority,
                message: notificationData.message,
                scheduledTime: scheduledTime,
                isDualAlert: notificationData.isDualAlert,
                status: NotificationStatus.SCHEDULED,
                reminderSent: false,
                createdAt: new Date(),
              };

              // Registrar el tiempo de emisión real
              let actualEmissionTime: number | null = null;
              
              // Espiar el método emitNotification para capturar el tiempo de emisión
              const emitNotificationSpy = vi.spyOn(service as any, 'emitNotification');
              const originalEmitNotification = emitNotificationSpy.getMockImplementation() || (service as any).emitNotification.bind(service);
              
              emitNotificationSpy.mockImplementation(async (notifId: string) => {
                actualEmissionTime = Date.now();
                // Llamar a la implementación original pero sin emitir realmente
                // Solo actualizar el estado
                const notif = await IndexedDBUtils.getById<Notification>(
                  IndexedDBUtils.STORES.NOTIFICATIONS,
                  notifId
                );
                if (notif) {
                  notif.status = NotificationStatus.SENT;
                  await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notif);
                }
              });

              // Programar la notificación
              const scheduleResult = await service.scheduleNotification(notification);
              expect(isOk(scheduleResult)).toBe(true);

              // Esperar a que se emita la notificación (con margen adicional)
              await new Promise(resolve => setTimeout(resolve, notificationData.delayMs + 100));

              // Verificar que la notificación fue emitida
              expect(actualEmissionTime).not.toBeNull();

              if (actualEmissionTime !== null) {
                // Calcular la diferencia entre el tiempo programado y el tiempo real de emisión
                const expectedEmissionTime = scheduledTime.getTime();
                const timeDifferenceMs = Math.abs(actualEmissionTime - expectedEmissionTime);
                
                // La diferencia debe ser menor o igual a 30 segundos (30000 ms)
                // Usamos un margen más generoso en pruebas (100ms) debido a la naturaleza de setTimeout
                // En producción, el margen real sería de 30 segundos
                const maxAllowedDifferenceMs = 100; // 100ms para pruebas
                
                // Verificar precisión temporal
                expect(timeDifferenceMs).toBeLessThanOrEqual(maxAllowedDifferenceMs);
              }

              // Limpiar
              emitNotificationSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          { numRuns: 2 } // Reducido para evitar timeouts
        );
      }, 10000); // 10 segundos de timeout

      it('debe emitir notificaciones inmediatamente si el tiempo programado ya pasó', async () => {
        // Verifica que notificaciones programadas en el pasado se emiten inmediatamente
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              // Programar notificaciones en el pasado (1 segundo a 10 segundos atrás)
              pastDelayMs: fc.integer({ min: 1000, max: 10000 }),
              isDualAlert: fc.boolean(),
            }),
            async (notificationData) => {
              // Calcular tiempo programado en el pasado
              const now = Date.now();
              const scheduledTime = new Date(now - notificationData.pastDelayMs);
              
              const notification: Notification = {
                id: notificationData.id,
                patientId: notificationData.patientId,
                type: notificationData.type as any,
                priority: notificationData.priority,
                message: notificationData.message,
                scheduledTime: scheduledTime,
                isDualAlert: notificationData.isDualAlert,
                status: NotificationStatus.SCHEDULED,
                reminderSent: false,
                createdAt: new Date(),
              };

              // Registrar el tiempo de emisión real
              let actualEmissionTime: number | null = null;
              let emissionCalled = false;
              
              // Espiar el método emitNotification
              const emitNotificationSpy = vi.spyOn(service as any, 'emitNotification');
              emitNotificationSpy.mockImplementation(async (notifId: string) => {
                actualEmissionTime = Date.now();
                emissionCalled = true;
                // Actualizar estado
                const notif = await IndexedDBUtils.getById<Notification>(
                  IndexedDBUtils.STORES.NOTIFICATIONS,
                  notifId
                );
                if (notif) {
                  notif.status = NotificationStatus.SENT;
                  await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notif);
                }
              });

              // Registrar tiempo antes de programar
              const beforeScheduleTime = Date.now();

              // Programar la notificación
              const scheduleResult = await service.scheduleNotification(notification);
              expect(isOk(scheduleResult)).toBe(true);

              // Esperar un poco para que se procese
              await new Promise(resolve => setTimeout(resolve, 50));

              // Verificar que la notificación fue emitida inmediatamente
              expect(emissionCalled).toBe(true);
              expect(actualEmissionTime).not.toBeNull();

              if (actualEmissionTime !== null) {
                // La emisión debe ocurrir casi inmediatamente (dentro de 200ms)
                const timeSinceSchedule = actualEmissionTime - beforeScheduleTime;
                expect(timeSinceSchedule).toBeLessThan(200);
              }

              // Limpiar
              emitNotificationSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          { numRuns: 2 } // Reducido para evitar timeouts
        );
      }, 10000); // 10 segundos de timeout

      it('debe mantener precisión temporal independientemente de la prioridad', async () => {
        // Verifica que la precisión temporal no depende de la prioridad de la notificación
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              delayMs: fc.integer({ min: 50, max: 300 }),
              isDualAlert: fc.boolean(),
            }),
            async (notificationData) => {
              const now = Date.now();
              const scheduledTime = new Date(now + notificationData.delayMs);
              
              const notification: Notification = {
                id: notificationData.id,
                patientId: notificationData.patientId,
                type: notificationData.type as any,
                priority: notificationData.priority,
                message: notificationData.message,
                scheduledTime: scheduledTime,
                isDualAlert: notificationData.isDualAlert,
                status: NotificationStatus.SCHEDULED,
                reminderSent: false,
                createdAt: new Date(),
              };

              let actualEmissionTime: number | null = null;
              
              const emitNotificationSpy = vi.spyOn(service as any, 'emitNotification');
              emitNotificationSpy.mockImplementation(async (notifId: string) => {
                actualEmissionTime = Date.now();
                const notif = await IndexedDBUtils.getById<Notification>(
                  IndexedDBUtils.STORES.NOTIFICATIONS,
                  notifId
                );
                if (notif) {
                  notif.status = NotificationStatus.SENT;
                  await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notif);
                }
              });

              await service.scheduleNotification(notification);
              await new Promise(resolve => setTimeout(resolve, notificationData.delayMs + 100));

              expect(actualEmissionTime).not.toBeNull();

              if (actualEmissionTime !== null) {
                const expectedEmissionTime = scheduledTime.getTime();
                const timeDifferenceMs = Math.abs(actualEmissionTime - expectedEmissionTime);
                
                // La precisión debe ser la misma independientemente de la prioridad
                expect(timeDifferenceMs).toBeLessThanOrEqual(100);
              }

              emitNotificationSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          { numRuns: 2 } // Reducido para evitar timeouts
        );
      }, 10000); // 10 segundos de timeout
    });

    describe('Propiedad 31: Recordatorios por notificaciones desatendidas', () => {
      it('debe emitir recordatorio automático después de 15 minutos si la notificación no es atendida', async () => {
        // Feature: cuido-a-mi-tata, Property 31: Recordatorios por notificaciones desatendidas
        // Valida: Requisitos 11.5
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              isDualAlert: fc.boolean(),
            }),
            async (notificationData) => {
              const notification: Notification = {
                id: notificationData.id,
                patientId: notificationData.patientId,
                type: notificationData.type as any,
                priority: notificationData.priority,
                message: notificationData.message,
                scheduledTime: new Date(),
                isDualAlert: notificationData.isDualAlert,
                status: NotificationStatus.SCHEDULED,
                reminderSent: false,
                createdAt: new Date(),
              };

              // Guardar la notificación en IndexedDB
              await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);

              // Espiar el método emitDualAlert para verificar que se llama para el recordatorio
              const emitDualAlertSpy = vi.spyOn(service, 'emitDualAlert');
              let reminderEmitted = false;
              let reminderMessage = '';
              
              emitDualAlertSpy.mockImplementation(async (message: string, priority: Priority) => {
                if (message.startsWith('Recordatorio:')) {
                  reminderEmitted = true;
                  reminderMessage = message;
                }
                return { ok: true, value: undefined } as any;
              });

              // Programar recordatorio con un delay corto para pruebas (100ms en lugar de 15 minutos)
              const testDelayMinutes = 0.001667; // ~100ms
              const result = await service.setReminderIfUnattended(notification.id, testDelayMinutes);
              
              expect(isOk(result)).toBe(true);

              // Esperar a que se emita el recordatorio
              await new Promise(resolve => setTimeout(resolve, 200));

              // Verificar que el recordatorio fue emitido
              expect(reminderEmitted).toBe(true);
              expect(reminderMessage).toContain('Recordatorio:');
              expect(reminderMessage).toContain(notification.message);

              // Verificar que la notificación fue marcada con reminderSent = true
              const updatedNotification = await IndexedDBUtils.getById<Notification>(
                IndexedDBUtils.STORES.NOTIFICATIONS,
                notification.id
              );
              expect(updatedNotification?.reminderSent).toBe(true);

              // Limpiar
              emitDualAlertSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          {  numRuns: 2 }
        );
      }, 15000); // 15 segundos de timeout

      it('NO debe emitir recordatorio si la notificación fue atendida (ACKNOWLEDGED)', async () => {
        // Verifica que notificaciones atendidas no generan recordatorios
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              isDualAlert: fc.boolean(),
            }),
            async (notificationData) => {
              const notification: Notification = {
                id: notificationData.id,
                patientId: notificationData.patientId,
                type: notificationData.type as any,
                priority: notificationData.priority,
                message: notificationData.message,
                scheduledTime: new Date(),
                isDualAlert: notificationData.isDualAlert,
                status: NotificationStatus.ACKNOWLEDGED, // Notificación ya atendida
                reminderSent: false,
                createdAt: new Date(),
              };

              await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);

              const emitDualAlertSpy = vi.spyOn(service, 'emitDualAlert');
              let reminderEmitted = false;
              
              emitDualAlertSpy.mockImplementation(async (message: string, priority: Priority) => {
                if (message.startsWith('Recordatorio:')) {
                  reminderEmitted = true;
                }
                return { ok: true, value: undefined } as any;
              });

              const testDelayMinutes = 0.001667; // ~100ms
              await service.setReminderIfUnattended(notification.id, testDelayMinutes);

              await new Promise(resolve => setTimeout(resolve, 200));

              // Verificar que NO se emitió recordatorio
              expect(reminderEmitted).toBe(false);

              emitDualAlertSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          {  numRuns: 2 }
        );
      }, 15000);

      it('NO debe emitir recordatorio si la notificación fue descartada (DISMISSED)', async () => {
        // Verifica que notificaciones descartadas no generan recordatorios
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              isDualAlert: fc.boolean(),
            }),
            async (notificationData) => {
              const notification: Notification = {
                id: notificationData.id,
                patientId: notificationData.patientId,
                type: notificationData.type as any,
                priority: notificationData.priority,
                message: notificationData.message,
                scheduledTime: new Date(),
                isDualAlert: notificationData.isDualAlert,
                status: NotificationStatus.DISMISSED, // Notificación descartada
                reminderSent: false,
                createdAt: new Date(),
              };

              await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);

              const emitDualAlertSpy = vi.spyOn(service, 'emitDualAlert');
              let reminderEmitted = false;
              
              emitDualAlertSpy.mockImplementation(async (message: string, priority: Priority) => {
                if (message.startsWith('Recordatorio:')) {
                  reminderEmitted = true;
                }
                return { ok: true, value: undefined } as any;
              });

              const testDelayMinutes = 0.001667; // ~100ms
              await service.setReminderIfUnattended(notification.id, testDelayMinutes);

              await new Promise(resolve => setTimeout(resolve, 200));

              // Verificar que NO se emitió recordatorio
              expect(reminderEmitted).toBe(false);

              emitDualAlertSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          {  numRuns: 2 }
        );
      }, 15000);

      it('debe emitir recordatorio para notificaciones en estado SENT (no atendidas)', async () => {
        // Verifica que notificaciones enviadas pero no atendidas generan recordatorios
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              isDualAlert: fc.boolean(),
            }),
            async (notificationData) => {
              const notification: Notification = {
                id: notificationData.id,
                patientId: notificationData.patientId,
                type: notificationData.type as any,
                priority: notificationData.priority,
                message: notificationData.message,
                scheduledTime: new Date(),
                isDualAlert: notificationData.isDualAlert,
                status: NotificationStatus.SENT, // Enviada pero no atendida
                reminderSent: false,
                createdAt: new Date(),
              };

              await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);

              const emitDualAlertSpy = vi.spyOn(service, 'emitDualAlert');
              let reminderEmitted = false;
              
              emitDualAlertSpy.mockImplementation(async (message: string, priority: Priority) => {
                if (message.startsWith('Recordatorio:')) {
                  reminderEmitted = true;
                }
                return { ok: true, value: undefined } as any;
              });

              const testDelayMinutes = 0.001667; // ~100ms
              await service.setReminderIfUnattended(notification.id, testDelayMinutes);

              await new Promise(resolve => setTimeout(resolve, 200));

              // Verificar que SÍ se emitió recordatorio
              expect(reminderEmitted).toBe(true);

              // Verificar que reminderSent fue marcado como true
              const updatedNotification = await IndexedDBUtils.getById<Notification>(
                IndexedDBUtils.STORES.NOTIFICATIONS,
                notification.id
              );
              expect(updatedNotification?.reminderSent).toBe(true);

              emitDualAlertSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          {  numRuns: 2 }
        );
      }, 15000);

      it('debe usar el delay especificado para emitir el recordatorio', async () => {
        // Verifica que el recordatorio se emite después del delay especificado
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              isDualAlert: fc.boolean(),
              // Delay entre 50ms y 300ms para pruebas
              delayMs: fc.integer({ min: 50, max: 300 }),
            }),
            async (notificationData) => {
              const notification: Notification = {
                id: notificationData.id,
                patientId: notificationData.patientId,
                type: notificationData.type as any,
                priority: notificationData.priority,
                message: notificationData.message,
                scheduledTime: new Date(),
                isDualAlert: notificationData.isDualAlert,
                status: NotificationStatus.SENT,
                reminderSent: false,
                createdAt: new Date(),
              };

              await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);

              const emitDualAlertSpy = vi.spyOn(service, 'emitDualAlert');
              let reminderEmissionTime: number | null = null;
              
              emitDualAlertSpy.mockImplementation(async (message: string, priority: Priority) => {
                if (message.startsWith('Recordatorio:')) {
                  reminderEmissionTime = Date.now();
                }
                return { ok: true, value: undefined } as any;
              });

              const startTime = Date.now();
              const delayMinutes = notificationData.delayMs / 60000; // Convertir ms a minutos
              await service.setReminderIfUnattended(notification.id, delayMinutes);

              // Esperar el delay más un margen
              await new Promise(resolve => setTimeout(resolve, notificationData.delayMs + 150));

              expect(reminderEmissionTime).not.toBeNull();

              if (reminderEmissionTime !== null) {
                const actualDelay = reminderEmissionTime - startTime;
                const expectedDelay = notificationData.delayMs;
                
                // Verificar que el delay está dentro de un margen razonable (±100ms)
                const timeDifference = Math.abs(actualDelay - expectedDelay);
                expect(timeDifference).toBeLessThanOrEqual(100);
              }

              emitDualAlertSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          { numRuns: 2 }
        );
      }, 15000);

      it('debe limpiar recordatorios existentes al programar uno nuevo para la misma notificación', async () => {
        // Verifica que solo se emite un recordatorio si se programa múltiples veces
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              isDualAlert: fc.boolean(),
            }),
            async (notificationData) => {
              const notification: Notification = {
                id: notificationData.id,
                patientId: notificationData.patientId,
                type: notificationData.type as any,
                priority: notificationData.priority,
                message: notificationData.message,
                scheduledTime: new Date(),
                isDualAlert: notificationData.isDualAlert,
                status: NotificationStatus.SENT,
                reminderSent: false,
                createdAt: new Date(),
              };

              await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);

              const emitDualAlertSpy = vi.spyOn(service, 'emitDualAlert');
              let reminderCount = 0;
              
              emitDualAlertSpy.mockImplementation(async (message: string, priority: Priority) => {
                if (message.startsWith('Recordatorio:')) {
                  reminderCount++;
                }
                return { ok: true, value: undefined } as any;
              });

              // Programar primer recordatorio
              await service.setReminderIfUnattended(notification.id, 0.001667); // ~100ms

              // Programar segundo recordatorio (debe cancelar el primero)
              await service.setReminderIfUnattended(notification.id, 0.003333); // ~200ms

              // Esperar a que se emita el segundo recordatorio
              await new Promise(resolve => setTimeout(resolve, 350));

              // Verificar que solo se emitió UN recordatorio (el segundo)
              expect(reminderCount).toBe(1);

              emitDualAlertSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          { numRuns: 2 }
        );
      }, 15000);
    });

    describe('Propiedad 29: Alertas duales para notificaciones críticas', () => {
      it('debe usar alerta dual para todas las notificaciones con prioridad CRITICAL', async () => {
        // Feature: cuido-a-mi-tata, Property 29: Alertas duales para notificaciones críticas
        // Valida: Requisitos 11.2
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 86400000) }),
              reminderSent: fc.boolean(),
            }),
            async (notificationData) => {
              // Crear notificación con prioridad CRITICAL
              const notification: Notification = {
                ...notificationData,
                type: notificationData.type as any,
                priority: Priority.CRITICAL,
                isDualAlert: false, // Inicialmente false para verificar que el sistema lo establece
                status: NotificationStatus.SCHEDULED,
                createdAt: new Date(),
              };

              // Espiar el método emitDualAlert para verificar que se llama
              const emitDualAlertSpy = vi.spyOn(service, 'emitDualAlert');
              
              // Espiar el método emitVisualAlert para verificar que NO se llama solo
              const emitVisualAlertSpy = vi.spyOn(service as any, 'emitVisualAlert');
              
              // Espiar el método emitAudioAlert para verificar que se llama
              const emitAudioAlertSpy = vi.spyOn(service as any, 'emitAudioAlert');

              // Programar la notificación
              const scheduleResult = await service.scheduleNotification(notification);
              expect(isOk(scheduleResult)).toBe(true);

              // Recuperar la notificación almacenada
              const storedNotification = await IndexedDBUtils.getById<Notification>(
                IndexedDBUtils.STORES.NOTIFICATIONS,
                notification.id
              );

              // Verificar que la notificación crítica tiene isDualAlert = true
              expect(storedNotification).toBeDefined();
              expect(storedNotification?.priority).toBe(Priority.CRITICAL);
              expect(storedNotification?.isDualAlert).toBe(true);

              // Emitir la notificación manualmente para verificar el comportamiento
              await (service as any).emitNotification(notification.id);

              // Verificar que emitDualAlert fue llamado
              expect(emitDualAlertSpy).toHaveBeenCalled();
              
              // Verificar que emitAudioAlert fue llamado (parte de la alerta dual)
              expect(emitAudioAlertSpy).toHaveBeenCalled();

              // Limpiar
              emitDualAlertSpy.mockRestore();
              emitVisualAlertSpy.mockRestore();
              emitAudioAlertSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          { numRuns: 2 }
        );
      });

      it('debe usar alerta dual para todas las notificaciones con prioridad HIGH', async () => {
        // Verifica que notificaciones HIGH también usan alertas duales
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 86400000) }),
              reminderSent: fc.boolean(),
            }),
            async (notificationData) => {
              const notification: Notification = {
                ...notificationData,
                type: notificationData.type as any,
                priority: Priority.HIGH,
                isDualAlert: false,
                status: NotificationStatus.SCHEDULED,
                createdAt: new Date(),
              };

              const emitDualAlertSpy = vi.spyOn(service, 'emitDualAlert');
              const emitAudioAlertSpy = vi.spyOn(service as any, 'emitAudioAlert');

              await service.scheduleNotification(notification);

              const storedNotification = await IndexedDBUtils.getById<Notification>(
                IndexedDBUtils.STORES.NOTIFICATIONS,
                notification.id
              );

              // Verificar que HIGH también tiene isDualAlert = true
              expect(storedNotification?.priority).toBe(Priority.HIGH);
              expect(storedNotification?.isDualAlert).toBe(true);

              await (service as any).emitNotification(notification.id);

              expect(emitDualAlertSpy).toHaveBeenCalled();
              expect(emitAudioAlertSpy).toHaveBeenCalled();

              emitDualAlertSpy.mockRestore();
              emitAudioAlertSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          { numRuns: 2 }
        );
      });

      it('debe usar solo alerta visual para notificaciones con prioridad MEDIUM o LOW', async () => {
        // Verifica que notificaciones no críticas NO usan alertas duales
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 86400000) }),
              reminderSent: fc.boolean(),
            }),
            async (notificationData) => {
              const notification: Notification = {
                ...notificationData,
                type: notificationData.type as any,
                isDualAlert: false,
                status: NotificationStatus.SCHEDULED,
                createdAt: new Date(),
              };

              const emitDualAlertSpy = vi.spyOn(service, 'emitDualAlert');
              const emitVisualAlertSpy = vi.spyOn(service as any, 'emitVisualAlert');

              await service.scheduleNotification(notification);

              const storedNotification = await IndexedDBUtils.getById<Notification>(
                IndexedDBUtils.STORES.NOTIFICATIONS,
                notification.id
              );

              // Verificar que MEDIUM y LOW NO tienen isDualAlert = true
              expect(storedNotification?.isDualAlert).toBe(false);

              await (service as any).emitNotification(notification.id);

              // Verificar que emitDualAlert NO fue llamado
              expect(emitDualAlertSpy).not.toHaveBeenCalled();
              
              // Verificar que solo emitVisualAlert fue llamado
              expect(emitVisualAlertSpy).toHaveBeenCalled();

              emitDualAlertSpy.mockRestore();
              emitVisualAlertSpy.mockRestore();
              await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.NOTIFICATIONS, notification.id);
            }
          ),
          { numRuns: 2 }
        );
      });

      it('debe incluir audio y vibración en alertas duales', async () => {
        // Verifica que las alertas duales incluyen tanto audio como vibración
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              message: fc.string({ minLength: 10, maxLength: 100 }),
              priority: fc.constantFrom(Priority.HIGH, Priority.CRITICAL),
            }),
            async (alertData) => {
              const emitVisualAlertSpy = vi.spyOn(service as any, 'emitVisualAlert');
              const emitAudioAlertSpy = vi.spyOn(service as any, 'emitAudioAlert');
              const emitVibrationSpy = vi.spyOn(service as any, 'emitVibration');

              // Emitir alerta dual directamente
              const result = await service.emitDualAlert(alertData.message, alertData.priority);

              // Verificar que fue exitoso
              expect(isOk(result)).toBe(true);

              // Verificar que se llamaron los tres métodos (visual, audio, vibración)
              expect(emitVisualAlertSpy).toHaveBeenCalledWith(alertData.message, alertData.priority);
              expect(emitAudioAlertSpy).toHaveBeenCalledWith(alertData.priority);
              expect(emitVibrationSpy).toHaveBeenCalledWith(alertData.priority);

              emitVisualAlertSpy.mockRestore();
              emitAudioAlertSpy.mockRestore();
              emitVibrationSpy.mockRestore();
            }
          ),
          { numRuns: 2 }
        );
      });
    });

    describe('Propiedad 30: Priorización de alertas múltiples', () => {
      it('debe ordenar alertas por prioridad (CRITICAL > HIGH > MEDIUM > LOW)', async () => {
        // Feature: cuido-a-mi-tata, Property 30: Priorización de alertas múltiples
        // Valida: Requisitos 11.3
        
        await fc.assert(
          fc.asyncProperty(
            // Generar array de notificaciones con diferentes prioridades
            fc.array(
              fc.record({
                id: fc.uuid(),
                patientId: fc.uuid(),
                type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
                priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
                message: fc.string({ minLength: 10, maxLength: 100 }),
                scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 86400000) }),
                isDualAlert: fc.boolean(),
              }),
              { minLength: 2, maxLength: 20 }
            ),
            async (notificationsData) => {
              // Crear notificaciones
              const notifications: Notification[] = notificationsData.map(data => ({
                ...data,
                type: data.type as any,
                status: NotificationStatus.SCHEDULED,
                reminderSent: false,
                createdAt: new Date(),
              }));

              // Priorizar alertas
              const prioritized = service.prioritizeAlerts(notifications);

              // Verificar que el array tiene el mismo tamaño
              expect(prioritized.length).toBe(notifications.length);

              // Definir orden de prioridad
              const priorityOrder: Record<Priority, number> = {
                [Priority.CRITICAL]: 4,
                [Priority.HIGH]: 3,
                [Priority.MEDIUM]: 2,
                [Priority.LOW]: 1,
              };

              // Verificar que están ordenadas correctamente
              for (let i = 1; i < prioritized.length; i++) {
                const prevPriority = priorityOrder[prioritized[i - 1].priority];
                const currPriority = priorityOrder[prioritized[i].priority];
                
                // La prioridad anterior debe ser mayor o igual a la actual
                expect(prevPriority).toBeGreaterThanOrEqual(currPriority);
              }

              // Verificar que todas las notificaciones CRITICAL están antes que HIGH
              const criticalIndices = prioritized
                .map((n, i) => (n.priority === Priority.CRITICAL ? i : -1))
                .filter(i => i !== -1);
              const highIndices = prioritized
                .map((n, i) => (n.priority === Priority.HIGH ? i : -1))
                .filter(i => i !== -1);

              if (criticalIndices.length > 0 && highIndices.length > 0) {
                const maxCriticalIndex = Math.max(...criticalIndices);
                const minHighIndex = Math.min(...highIndices);
                expect(maxCriticalIndex).toBeLessThan(minHighIndex);
              }

              // Verificar que todas las notificaciones HIGH están antes que MEDIUM
              const mediumIndices = prioritized
                .map((n, i) => (n.priority === Priority.MEDIUM ? i : -1))
                .filter(i => i !== -1);

              if (highIndices.length > 0 && mediumIndices.length > 0) {
                const maxHighIndex = Math.max(...highIndices);
                const minMediumIndex = Math.min(...mediumIndices);
                expect(maxHighIndex).toBeLessThan(minMediumIndex);
              }

              // Verificar que todas las notificaciones MEDIUM están antes que LOW
              const lowIndices = prioritized
                .map((n, i) => (n.priority === Priority.LOW ? i : -1))
                .filter(i => i !== -1);

              if (mediumIndices.length > 0 && lowIndices.length > 0) {
                const maxMediumIndex = Math.max(...mediumIndices);
                const minLowIndex = Math.min(...lowIndices);
                expect(maxMediumIndex).toBeLessThan(minLowIndex);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe ordenar por tiempo programado cuando las prioridades son iguales', async () => {
        // Verifica que notificaciones con la misma prioridad se ordenan por tiempo programado
        
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
            fc.array(
              fc.record({
                id: fc.uuid(),
                patientId: fc.uuid(),
                type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
                message: fc.string({ minLength: 10, maxLength: 100 }),
                scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 86400000) }),
                isDualAlert: fc.boolean(),
              }),
              { minLength: 2, maxLength: 10 }
            ),
            async (priority, notificationsData) => {
              // Crear notificaciones con la misma prioridad
              const notifications: Notification[] = notificationsData.map(data => ({
                ...data,
                type: data.type as any,
                priority: priority, // Todas tienen la misma prioridad
                status: NotificationStatus.SCHEDULED,
                reminderSent: false,
                createdAt: new Date(),
              }));

              // Priorizar alertas
              const prioritized = service.prioritizeAlerts(notifications);

              // Verificar que están ordenadas por tiempo programado (más antiguo primero)
              for (let i = 1; i < prioritized.length; i++) {
                const prevTime = new Date(prioritized[i - 1].scheduledTime).getTime();
                const currTime = new Date(prioritized[i].scheduledTime).getTime();
                
                // El tiempo anterior debe ser menor o igual al actual
                expect(prevTime).toBeLessThanOrEqual(currTime);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe mantener todas las notificaciones después de priorizar', async () => {
        // Verifica que no se pierden notificaciones durante la priorización
        
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                id: fc.uuid(),
                patientId: fc.uuid(),
                type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
                priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
                message: fc.string({ minLength: 10, maxLength: 100 }),
                scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 86400000) }),
                isDualAlert: fc.boolean(),
              }),
              { minLength: 1, maxLength: 50 }
            ),
            async (notificationsData) => {
              const notifications: Notification[] = notificationsData.map(data => ({
                ...data,
                type: data.type as any,
                status: NotificationStatus.SCHEDULED,
                reminderSent: false,
                createdAt: new Date(),
              }));

              const prioritized = service.prioritizeAlerts(notifications);

              // Verificar que el tamaño es el mismo
              expect(prioritized.length).toBe(notifications.length);

              // Verificar que todas las notificaciones originales están presentes
              const originalIds = new Set(notifications.map(n => n.id));
              const prioritizedIds = new Set(prioritized.map(n => n.id));

              expect(prioritizedIds.size).toBe(originalIds.size);
              originalIds.forEach(id => {
                expect(prioritizedIds.has(id)).toBe(true);
              });
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe funcionar con array vacío', async () => {
        // Verifica que priorizar un array vacío devuelve un array vacío
        
        const prioritized = service.prioritizeAlerts([]);
        expect(prioritized).toEqual([]);
        expect(prioritized.length).toBe(0);
      });

      it('debe funcionar con una sola notificación', async () => {
        // Verifica que priorizar una sola notificación la devuelve sin cambios
        
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
              priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 86400000) }),
              isDualAlert: fc.boolean(),
            }),
            async (notificationData) => {
              const notification: Notification = {
                ...notificationData,
                type: notificationData.type as any,
                status: NotificationStatus.SCHEDULED,
                reminderSent: false,
                createdAt: new Date(),
              };

              const prioritized = service.prioritizeAlerts([notification]);

              expect(prioritized.length).toBe(1);
              expect(prioritized[0].id).toBe(notification.id);
              expect(prioritized[0].priority).toBe(notification.priority);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe filtrar alertas por prioridad mínima en getAlertsByPriority', async () => {
        // Verifica que getAlertsByPriority filtra correctamente por prioridad mínima
        
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                id: fc.uuid(),
                patientId: fc.uuid(),
                type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
                priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
                message: fc.string({ minLength: 10, maxLength: 100 }),
                scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 86400000) }),
                isDualAlert: fc.boolean(),
              }),
              { minLength: 5, maxLength: 20 }
            ),
            fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
            async (notificationsData, minPriority) => {
              // Limpiar notificaciones existentes
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);

              // Crear y guardar notificaciones
              const notifications: Notification[] = notificationsData.map(data => ({
                ...data,
                type: data.type as any,
                status: NotificationStatus.SCHEDULED, // Solo SCHEDULED o SENT se incluyen
                reminderSent: false,
                createdAt: new Date(),
              }));

              for (const notification of notifications) {
                await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);
              }

              // Obtener alertas filtradas
              const filtered = await service.getAlertsByPriority(minPriority);

              // Definir orden de prioridad
              const priorityOrder: Record<Priority, number> = {
                [Priority.CRITICAL]: 4,
                [Priority.HIGH]: 3,
                [Priority.MEDIUM]: 2,
                [Priority.LOW]: 1,
              };

              const minPriorityValue = priorityOrder[minPriority];

              // Verificar que todas las alertas filtradas tienen prioridad >= minPriority
              filtered.forEach(alert => {
                expect(priorityOrder[alert.priority]).toBeGreaterThanOrEqual(minPriorityValue);
              });

              // Verificar que están ordenadas por prioridad
              for (let i = 1; i < filtered.length; i++) {
                const prevPriority = priorityOrder[filtered[i - 1].priority];
                const currPriority = priorityOrder[filtered[i].priority];
                expect(prevPriority).toBeGreaterThanOrEqual(currPriority);
              }

              // Limpiar
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
            }
          ),
          { numRuns: 20 }
        );
      });

      it('debe excluir notificaciones atendidas o descartadas en getAlertsByPriority', async () => {
        // Verifica que solo se incluyen notificaciones SCHEDULED o SENT
        
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.record({
                id: fc.uuid(),
                patientId: fc.uuid(),
                type: fc.constantFrom('MEDICATION', 'POSTURAL_CHANGE', 'HYDRATION', 'BATHROOM', 'RISK_ALERT'),
                priority: fc.constantFrom(Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL),
                message: fc.string({ minLength: 10, maxLength: 100 }),
                scheduledTime: fc.date({ min: new Date(), max: new Date(Date.now() + 86400000) }),
                isDualAlert: fc.boolean(),
                status: fc.constantFrom(
                  NotificationStatus.SCHEDULED,
                  NotificationStatus.SENT,
                  NotificationStatus.ACKNOWLEDGED,
                  NotificationStatus.DISMISSED
                ),
              }),
              { minLength: 5, maxLength: 20 }
            ),
            async (notificationsData) => {
              // Limpiar notificaciones existentes
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);

              // Crear y guardar notificaciones
              const notifications: Notification[] = notificationsData.map(data => ({
                ...data,
                type: data.type as any,
                reminderSent: false,
                createdAt: new Date(),
              }));

              for (const notification of notifications) {
                await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);
              }

              // Obtener alertas
              const alerts = await service.getAlertsByPriority();

              // Verificar que solo incluye SCHEDULED o SENT
              alerts.forEach(alert => {
                expect(
                  alert.status === NotificationStatus.SCHEDULED ||
                  alert.status === NotificationStatus.SENT
                ).toBe(true);
              });

              // Verificar que no incluye ACKNOWLEDGED o DISMISSED
              const acknowledgedOrDismissed = notifications.filter(
                n => n.status === NotificationStatus.ACKNOWLEDGED || n.status === NotificationStatus.DISMISSED
              );
              const alertIds = new Set(alerts.map(a => a.id));
              
              acknowledgedOrDismissed.forEach(n => {
                expect(alertIds.has(n.id)).toBe(false);
              });

              // Limpiar
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
            }
          ),
          { numRuns: 20 }
        );
      });
    });
  });

  describe('Unit Tests', () => {
    describe('scheduleNotification', () => {
      it('debe programar una notificación correctamente', async () => {
        const notification: Notification = {
          id: 'test-notif-1',
          patientId: 'patient-1',
          type: 'MEDICATION',
          priority: Priority.HIGH,
          message: 'Hora de tomar medicamento',
          scheduledTime: new Date(Date.now() + 5000),
          isDualAlert: true,
          status: NotificationStatus.SCHEDULED,
          reminderSent: false,
          createdAt: new Date(),
        };

        const result = await service.scheduleNotification(notification);
        
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toBe(notification.id);
        }
      });

      it('debe rechazar notificaciones sin campos requeridos', async () => {
        const invalidNotification = {
          message: 'Test',
          priority: Priority.LOW,
        } as any;

        const result = await service.scheduleNotification(invalidNotification);
        
        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
        }
      });
    });

    describe('emitDualAlert', () => {
      it('debe emitir alerta dual correctamente', async () => {
        const result = await service.emitDualAlert('Mensaje de prueba', Priority.HIGH);
        
        expect(isOk(result)).toBe(true);
      });

      it('debe manejar diferentes prioridades', async () => {
        const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL];
        
        for (const priority of priorities) {
          const result = await service.emitDualAlert(`Mensaje ${priority}`, priority);
          expect(isOk(result)).toBe(true);
        }
      });
    });

    describe('cancelNotification', () => {
      it('debe cancelar una notificación programada', async () => {
        const notification: Notification = {
          id: 'test-cancel-1',
          patientId: 'patient-1',
          type: 'MEDICATION',
          priority: Priority.MEDIUM,
          message: 'Test',
          scheduledTime: new Date(Date.now() + 10000),
          isDualAlert: false,
          status: NotificationStatus.SCHEDULED,
          reminderSent: false,
          createdAt: new Date(),
        };

        await service.scheduleNotification(notification);
        const result = await service.cancelNotification(notification.id);
        
        expect(isOk(result)).toBe(true);

        // Verificar que el estado cambió a DISMISSED
        const storedNotification = await IndexedDBUtils.getById<Notification>(
          IndexedDBUtils.STORES.NOTIFICATIONS,
          notification.id
        );
        expect(storedNotification?.status).toBe(NotificationStatus.DISMISSED);
      });

      it('debe manejar cancelación de notificación inexistente', async () => {
        const result = await service.cancelNotification('nonexistent-id');
        
        expect(isOk(result)).toBe(true);
      });
    });

    describe('setReminderIfUnattended', () => {
      it('debe programar recordatorio correctamente', async () => {
        const result = await service.setReminderIfUnattended('test-notif-1', 15);
        
        expect(isOk(result)).toBe(true);
      });
    });

    describe('getUserPreferences', () => {
      it('debe retornar preferencias por defecto', () => {
        const preferences = service.getUserPreferences();
        
        expect(preferences).toBeDefined();
        expect(preferences.enableSound).toBe(true);
        expect(preferences.enableVibration).toBe(true);
        expect(preferences.enablePushNotifications).toBe(true);
        expect(preferences.priorityFilter).toBe('ALL');
      });
    });
  });
});

