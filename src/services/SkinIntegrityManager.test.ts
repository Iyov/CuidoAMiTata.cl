/**
 * Pruebas para SkinIntegrityManager
 * Incluye pruebas basadas en propiedades y pruebas unitarias
 */

import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  SkinIntegrityManager,
  getSkinIntegrityManager,
  resetSkinIntegrityManager,
} from './SkinIntegrityManager';
import { resetNotificationService } from './NotificationService';
import { Position, UlcerGrade, HealingStatus } from '../types/enums';
import type { PosturalChange, PressureUlcer, Photo } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

describe('SkinIntegrityManager', () => {
  let skinIntegrityManager: SkinIntegrityManager;

  beforeEach(async () => {
    resetSkinIntegrityManager();
    resetNotificationService();
    skinIntegrityManager = getSkinIntegrityManager();
    
    // Limpiar stores relevantes
    await IndexedDBUtils.clear(IndexedDBUtils.STORES.POSTURAL_CHANGES);
    await IndexedDBUtils.clear(IndexedDBUtils.STORES.PRESSURE_ULCERS);
    await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property-Based Tests', () => {
    describe('Propiedad 7: Programación de cambios posturales diurnos', () => {
      it('debe programar exactamente 8 notificaciones diurnas cada 2 horas (06:00-22:00)', async () => {
        // Feature: cuido-a-mi-tata, Property 7: Programación de cambios posturales diurnos
        // Valida: Requisitos 3.1
        
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(), // patientId
            async (patientId) => {
              // Limpiar notificaciones antes de cada prueba
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
              
              // Programar cambios posturales
              const result = await skinIntegrityManager.schedulePosturalChanges(patientId);
              
              // Verificar que la operación fue exitosa
              if (!result.ok) {
                return false;
              }
              
              // Obtener todas las notificaciones programadas
              const notifications = await IndexedDBUtils.getAll<any>(
                IndexedDBUtils.STORES.NOTIFICATIONS
              );
              
              // Filtrar notificaciones diurnas para este paciente
              const dayNotifications = notifications.filter(
                (n) =>
                  n.patientId === patientId &&
                  n.id.includes('postural-day')
              );
              
              // Verificar que hay exactamente 8 notificaciones diurnas
              if (dayNotifications.length !== 8) {
                return false;
              }
              
              // Verificar que las notificaciones están programadas cada 2 horas
              // Horarios esperados: 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00
              const expectedHours = [6, 8, 10, 12, 14, 16, 18, 20];
              const actualHours = dayNotifications
                .map((n) => new Date(n.scheduledTime).getHours())
                .sort((a, b) => a - b);
              
              // Verificar que los horarios coinciden
              const hoursMatch = expectedHours.every(
                (hour, index) => actualHours[index] === hour
              );
              
              if (!hoursMatch) {
                return false;
              }
              
              // Verificar que todas las notificaciones diurnas tienen isDualAlert=true
              const allDualAlert = dayNotifications.every((n) => n.isDualAlert === true);
              
              return allDualAlert;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe programar notificaciones diurnas con intervalo de exactamente 2 horas', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            async (patientId) => {
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
              
              const result = await skinIntegrityManager.schedulePosturalChanges(patientId);
              
              if (!result.ok) {
                return false;
              }
              
              const notifications = await IndexedDBUtils.getAll<any>(
                IndexedDBUtils.STORES.NOTIFICATIONS
              );
              
              const dayNotifications = notifications
                .filter((n) => n.patientId === patientId && n.id.includes('postural-day'))
                .sort((a, b) => new Date(a.scheduledTime).getHours() - new Date(b.scheduledTime).getHours());
              
              // Verificar intervalos de 2 horas entre notificaciones consecutivas
              for (let i = 1; i < dayNotifications.length; i++) {
                const prevHour = new Date(dayNotifications[i - 1].scheduledTime).getHours();
                const currHour = new Date(dayNotifications[i].scheduledTime).getHours();
                const interval = currHour - prevHour;
                
                if (interval !== 2) {
                  return false;
                }
              }
              
              return true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe programar notificaciones diurnas dentro del período 06:00-22:00', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            async (patientId) => {
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
              
              const result = await skinIntegrityManager.schedulePosturalChanges(patientId);
              
              if (!result.ok) {
                return false;
              }
              
              const notifications = await IndexedDBUtils.getAll<any>(
                IndexedDBUtils.STORES.NOTIFICATIONS
              );
              
              const dayNotifications = notifications.filter(
                (n) => n.patientId === patientId && n.id.includes('postural-day')
              );
              
              // Verificar que todas las notificaciones están entre 06:00 y 20:00 (última notificación diurna)
              return dayNotifications.every((n) => {
                const hour = new Date(n.scheduledTime).getHours();
                return hour >= 6 && hour <= 20;
              });
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Propiedad 8: Programación de cambios posturales nocturnos', () => {
      it('debe programar exactamente 3 notificaciones nocturnas (22:00-06:00)', async () => {
        // Feature: cuido-a-mi-tata, Property 8: Programación de cambios posturales nocturnos
        // Valida: Requisitos 3.2
        
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            async (patientId) => {
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
              
              const result = await skinIntegrityManager.schedulePosturalChanges(patientId);
              
              if (!result.ok) {
                return false;
              }
              
              const notifications = await IndexedDBUtils.getAll<any>(
                IndexedDBUtils.STORES.NOTIFICATIONS
              );
              
              const nightNotifications = notifications.filter(
                (n) => n.patientId === patientId && n.id.includes('postural-night')
              );
              
              // Verificar que hay exactamente 3 notificaciones nocturnas
              if (nightNotifications.length !== 3) {
                return false;
              }
              
              // Verificar horarios esperados: 22:00, 00:00, 04:00
              const expectedHours = [22, 0, 4];
              const actualHours = nightNotifications
                .map((n) => new Date(n.scheduledTime).getHours())
                .sort((a, b) => {
                  // Ordenar considerando que 0 y 4 son después de 22
                  if (a === 22) return -1;
                  if (b === 22) return 1;
                  return a - b;
                });
              
              const sortedExpected = [22, 0, 4];
              const hoursMatch = sortedExpected.every(
                (hour, index) => actualHours[index] === hour
              );
              
              return hoursMatch;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe programar notificaciones nocturnas con isDualAlert=false', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            async (patientId) => {
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
              
              const result = await skinIntegrityManager.schedulePosturalChanges(patientId);
              
              if (!result.ok) {
                return false;
              }
              
              const notifications = await IndexedDBUtils.getAll<any>(
                IndexedDBUtils.STORES.NOTIFICATIONS
              );
              
              const nightNotifications = notifications.filter(
                (n) => n.patientId === patientId && n.id.includes('postural-night')
              );
              
              // Verificar que todas las notificaciones nocturnas tienen isDualAlert=false
              return nightNotifications.every((n) => n.isDualAlert === false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe programar notificaciones nocturnas en el período correcto', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.uuid(),
            async (patientId) => {
              await IndexedDBUtils.clear(IndexedDBUtils.STORES.NOTIFICATIONS);
              
              const result = await skinIntegrityManager.schedulePosturalChanges(patientId);
              
              if (!result.ok) {
                return false;
              }
              
              const notifications = await IndexedDBUtils.getAll<any>(
                IndexedDBUtils.STORES.NOTIFICATIONS
              );
              
              const nightNotifications = notifications.filter(
                (n) => n.patientId === patientId && n.id.includes('postural-night')
              );
              
              // Verificar que todas las notificaciones están en el período nocturno
              // 22:00-06:00 significa horas 22, 23, 0, 1, 2, 3, 4, 5
              return nightNotifications.every((n) => {
                const hour = new Date(n.scheduledTime).getHours();
                return hour >= 22 || hour <= 5;
              });
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('Unit Tests - Scheduling', () => {
    describe('Programación de cambios posturales', () => {
      it('debe programar 8 notificaciones diurnas en horarios exactos', async () => {
        const patientId = 'test-patient-1';
        
        const result = await skinIntegrityManager.schedulePosturalChanges(patientId);
        
        expect(result.ok).toBe(true);
        
        const notifications = await IndexedDBUtils.getAll<any>(
          IndexedDBUtils.STORES.NOTIFICATIONS
        );
        
        const dayNotifications = notifications.filter(
          (n) => n.patientId === patientId && n.id.includes('postural-day')
        );
        
        expect(dayNotifications).toHaveLength(8);
        
        // Verificar horarios exactos
        const hours = dayNotifications
          .map((n) => new Date(n.scheduledTime).getHours())
          .sort((a, b) => a - b);
        
        expect(hours).toEqual([6, 8, 10, 12, 14, 16, 18, 20]);
      });

      it('debe programar 3 notificaciones nocturnas en horarios exactos', async () => {
        const patientId = 'test-patient-2';
        
        const result = await skinIntegrityManager.schedulePosturalChanges(patientId);
        
        expect(result.ok).toBe(true);
        
        const notifications = await IndexedDBUtils.getAll<any>(
          IndexedDBUtils.STORES.NOTIFICATIONS
        );
        
        const nightNotifications = notifications.filter(
          (n) => n.patientId === patientId && n.id.includes('postural-night')
        );
        
        expect(nightNotifications).toHaveLength(3);
        
        // Verificar horarios exactos
        const hours = nightNotifications
          .map((n) => new Date(n.scheduledTime).getHours())
          .sort((a, b) => {
            if (a === 22) return -1;
            if (b === 22) return 1;
            return a - b;
          });
        
        expect(hours).toEqual([22, 0, 4]);
      });

      it('debe programar notificaciones con minutos en 00', async () => {
        const patientId = 'test-patient-3';
        
        const result = await skinIntegrityManager.schedulePosturalChanges(patientId);
        
        expect(result.ok).toBe(true);
        
        const notifications = await IndexedDBUtils.getAll<any>(
          IndexedDBUtils.STORES.NOTIFICATIONS
        );
        
        const allNotifications = notifications.filter((n) => n.patientId === patientId);
        
        // Verificar que todos los minutos son 00
        allNotifications.forEach((n) => {
          const minutes = new Date(n.scheduledTime).getMinutes();
          expect(minutes).toBe(0);
        });
      });
    });

    describe('Registro de cambios posturales', () => {
      it('debe registrar un cambio postural correctamente', async () => {
        const posturalChange: PosturalChange = {
          id: 'change-1',
          patientId: 'patient-1',
          position: Position.LEFT_LATERAL,
          performedAt: new Date(),
          performedBy: 'caregiver-1',
          notes: 'Cambio realizado sin problemas',
          createdAt: new Date(),
        };
        
        const result = await skinIntegrityManager.recordPosturalChange(posturalChange);
        
        expect(result.ok).toBe(true);
        
        const saved = await IndexedDBUtils.getById<PosturalChange>(
          IndexedDBUtils.STORES.POSTURAL_CHANGES,
          'change-1'
        );
        
        expect(saved).toBeDefined();
        expect(saved?.position).toBe(Position.LEFT_LATERAL);
      });

      it('debe validar elevación de cama al registrar cambio postural', async () => {
        const posturalChange: PosturalChange = {
          id: 'change-2',
          patientId: 'patient-1',
          position: Position.SUPINE,
          bedElevation: 35, // Excede el máximo de 30 grados
          performedAt: new Date(),
          performedBy: 'caregiver-1',
          notes: '',
          createdAt: new Date(),
        };
        
        const result = await skinIntegrityManager.recordPosturalChange(posturalChange);
        
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain('30 grados');
        }
      });

      it('debe aceptar elevación de cama válida', async () => {
        const posturalChange: PosturalChange = {
          id: 'change-3',
          patientId: 'patient-1',
          position: Position.SUPINE,
          bedElevation: 25, // Válido
          performedAt: new Date(),
          performedBy: 'caregiver-1',
          notes: '',
          createdAt: new Date(),
        };
        
        const result = await skinIntegrityManager.recordPosturalChange(posturalChange);
        
        expect(result.ok).toBe(true);
      });
    });

    describe('Registro de úlceras por presión', () => {
      it('debe registrar una úlcera con fotografía', async () => {
        const photo: Photo = {
          id: 'photo-1',
          url: 'https://example.com/photo.jpg',
          capturedAt: new Date(),
          notes: 'Fotografía inicial',
        };
        
        const ulcer: PressureUlcer = {
          id: 'ulcer-1',
          patientId: 'patient-1',
          grade: UlcerGrade.II,
          location: 'Sacro',
          size: {
            length: 3.5,
            width: 2.0,
          },
          photos: [],
          treatment: 'Apósito hidrocoloide',
          assessedAt: new Date(),
          healingStatus: HealingStatus.NEW,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const result = await skinIntegrityManager.recordPressureUlcer(ulcer, photo);
        
        expect(result.ok).toBe(true);
        
        const saved = await IndexedDBUtils.getById<PressureUlcer>(
          IndexedDBUtils.STORES.PRESSURE_ULCERS,
          'ulcer-1'
        );
        
        expect(saved).toBeDefined();
        expect(saved?.photos).toHaveLength(1);
        expect(saved?.photos[0].id).toBe('photo-1');
      });

      it('debe validar campos requeridos al registrar úlcera', async () => {
        const ulcer: PressureUlcer = {
          id: 'ulcer-2',
          patientId: '', // Vacío - inválido
          grade: UlcerGrade.I,
          location: 'Talón',
          size: {
            length: 1.0,
            width: 1.0,
          },
          photos: [],
          treatment: '',
          assessedAt: new Date(),
          healingStatus: HealingStatus.NEW,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const result = await skinIntegrityManager.recordPressureUlcer(ulcer);
        
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain('patientId');
        }
      });
    });
  });
});
