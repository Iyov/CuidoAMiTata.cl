/**
 * Tests for IncontinenceManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  IncontinenceManager,
  getIncontinenceManager,
  resetIncontinenceManager,
} from './IncontinenceManager';
import { resetNotificationService } from './NotificationService';
import { IncontinenceEventType, IncontinenceSeverity, ErrorCode } from '../types/enums';
import type { IncontinenceEvent, PatternAnalysis } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

// Mock IndexedDB utilities con almacenamiento en memoria
const mockStorage: Record<string, Record<string, any>> = {
  patients: {},
  medications: {},
  careEvents: {},
  notifications: {},
  syncQueue: {},
  encrypted_data: {},
  incontinenceEvents: {},
};

vi.mock('../utils/indexedDB', () => ({
  STORES: {
    PATIENTS: 'patients',
    MEDICATIONS: 'medications',
    CARE_EVENTS: 'careEvents',
    NOTIFICATIONS: 'notifications',
    SYNC_QUEUE: 'syncQueue',
    ENCRYPTED_DATA: 'encrypted_data',
    INCONTINENCE_EVENTS: 'incontinenceEvents',
  },
  put: vi.fn(async (store: string, data: any) => {
    mockStorage[store][data.id] = data;
    return data;
  }),
  getById: vi.fn(async (store: string, id: string) => {
    return mockStorage[store][id];
  }),
  getByIndex: vi.fn(async (store: string, indexName: string, value: any) => {
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

describe('IncontinenceManager', () => {
  let manager: IncontinenceManager;

  beforeEach(() => {
    // Limpiar almacenamiento mock
    mockStorage.patients = {};
    mockStorage.medications = {};
    mockStorage.careEvents = {};
    mockStorage.notifications = {};
    mockStorage.syncQueue = {};
    mockStorage.encrypted_data = {};
    mockStorage.incontinenceEvents = {};

    resetIncontinenceManager();
    resetNotificationService();
    manager = getIncontinenceManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 12: Programación de recordatorios de baño', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 12: Programación de recordatorios de baño
     * Valida: Requisitos 5.1
     * 
     * Para cualquier paciente, el sistema debe programar recordatorios de visita
     * al baño con intervalos entre 2 y 3 horas.
     */
    it('debe programar recordatorios con intervalos entre 2 y 3 horas', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // patientId
          fc.integer({ min: 2, max: 3 }), // intervalHours (2 o 3)
          async (patientId, intervalHours) => {
            // Limpiar notificaciones previas
            mockStorage.notifications = {};

            // Programar recordatorios
            const result = await manager.scheduleBathroomReminders(patientId, intervalHours);

            // Verificar que el resultado es exitoso
            if (!result.ok) return false;

            // Obtener notificaciones programadas
            const notifications = Object.values(mockStorage.notifications);

            // Propiedad: Debe haber notificaciones programadas
            if (notifications.length === 0) return false;

            // Calcular número esperado de recordatorios en 24 horas
            const expectedReminders = Math.floor(24 / intervalHours);

            // Propiedad: El número de recordatorios debe coincidir con el esperado
            if (notifications.length !== expectedReminders) return false;

            // Verificar que todas las notificaciones son para el paciente correcto
            const allForCorrectPatient = notifications.every(
              (n: any) => n.patientId === patientId
            );
            if (!allForCorrectPatient) return false;

            // Verificar que todas son notificaciones de baño
            const allBathroomType = notifications.every(
              (n: any) => n.type === 'BATHROOM'
            );
            if (!allBathroomType) return false;

            // Verificar intervalos entre notificaciones
            const sortedNotifications = notifications
              .map((n: any) => new Date(n.scheduledTime))
              .sort((a, b) => a.getTime() - b.getTime());

            for (let i = 1; i < sortedNotifications.length; i++) {
              const prevTime = sortedNotifications[i - 1];
              const currTime = sortedNotifications[i];
              const diffHours = (currTime.getTime() - prevTime.getTime()) / (1000 * 60 * 60);

              // El intervalo debe ser aproximadamente el especificado (con margen de error)
              const isCorrectInterval = Math.abs(diffHours - intervalHours) < 0.1;
              if (!isCorrectInterval) return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe rechazar intervalos fuera del rango 2-3 horas', async () => {
      const patientId = 'patient-invalid-interval';

      // Intervalo muy corto
      const resultShort = await manager.scheduleBathroomReminders(patientId, 1);
      expect(resultShort.ok).toBe(false);
      if (!resultShort.ok) {
        expect(resultShort.error.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
      }

      // Intervalo muy largo
      const resultLong = await manager.scheduleBathroomReminders(patientId, 4);
      expect(resultLong.ok).toBe(false);
      if (!resultLong.ok) {
        expect(resultLong.error.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
      }
    });

    it('debe programar 12 recordatorios para intervalo de 2 horas', async () => {
      const patientId = 'patient-2h-interval';
      mockStorage.notifications = {};

      const result = await manager.scheduleBathroomReminders(patientId, 2);

      expect(result.ok).toBe(true);

      const notifications = Object.values(mockStorage.notifications);
      expect(notifications.length).toBe(12); // 24 / 2 = 12
    });

    it('debe programar 8 recordatorios para intervalo de 3 horas', async () => {
      const patientId = 'patient-3h-interval';
      mockStorage.notifications = {};

      const result = await manager.scheduleBathroomReminders(patientId, 3);

      expect(result.ok).toBe(true);

      const notifications = Object.values(mockStorage.notifications);
      expect(notifications.length).toBe(8); // 24 / 3 = 8
    });
  });

  describe('Property 13: Persistencia de historial de episodios', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 13: Persistencia de historial de episodios
     * Valida: Requisitos 5.4
     * 
     * Para cualquier episodio de incontinencia registrado, el sistema debe
     * almacenarlo en el historial y permitir su recuperación para análisis de patrones.
     */
    it('debe persistir episodios y permitir recuperación para análisis', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // patientId
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
              severity: fc.constantFrom(
                IncontinenceSeverity.MINOR,
                IncontinenceSeverity.MODERATE,
                IncontinenceSeverity.MAJOR
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (patientId, episodes) => {
            // Limpiar eventos previos para este paciente
            const allEvents = Object.values(mockStorage.incontinenceEvents) as IncontinenceEvent[];
            allEvents.forEach((event) => {
              if (event.patientId === patientId) {
                delete mockStorage.incontinenceEvents[event.id];
              }
            });

            // Registrar todos los episodios
            for (const episode of episodes) {
              const result = await manager.recordIncontinenceEpisode(
                patientId,
                episode.timestamp,
                episode.severity,
                'Test episode'
              );
              if (!result.ok) return false;
            }

            // Definir rango de fechas que cubra todos los episodios
            const timestamps = episodes.map((e) => e.timestamp.getTime());
            const minDate = new Date(Math.min(...timestamps));
            const maxDate = new Date(Math.max(...timestamps));

            // Agregar margen al rango
            minDate.setDate(minDate.getDate() - 1);
            maxDate.setDate(maxDate.getDate() + 1);

            // Analizar patrones
            const analysis = await manager.analyzePatterns(patientId, {
              start: minDate,
              end: maxDate,
            });

            // Propiedad: El análisis debe incluir todos los episodios registrados
            const episodeCount = episodes.length;
            const analysisCount = analysis.totalEvents;

            // Debe haber al menos tantos eventos como episodios registrados
            // (puede haber más si incluye visitas al baño)
            return analysisCount >= episodeCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe recuperar episodios específicos del paciente', async () => {
      const patient1 = 'patient-1';
      const patient2 = 'patient-2';
      const timestamp = new Date('2024-06-15T10:00:00');

      // Registrar episodios para dos pacientes diferentes
      await manager.recordIncontinenceEpisode(patient1, timestamp, IncontinenceSeverity.MINOR);
      await manager.recordIncontinenceEpisode(patient2, timestamp, IncontinenceSeverity.MAJOR);

      // Analizar patrones para patient1
      const analysis1 = await manager.analyzePatterns(patient1, {
        start: new Date('2024-06-01'),
        end: new Date('2024-06-30'),
      });

      // Analizar patrones para patient2
      const analysis2 = await manager.analyzePatterns(patient2, {
        start: new Date('2024-06-01'),
        end: new Date('2024-06-30'),
      });

      // Cada paciente debe tener solo sus propios eventos
      expect(analysis1.totalEvents).toBeGreaterThanOrEqual(1);
      expect(analysis2.totalEvents).toBeGreaterThanOrEqual(1);
      expect(analysis1.patientId).toBe(patient1);
      expect(analysis2.patientId).toBe(patient2);
    });

    it('debe incluir tendencias en el análisis de patrones', async () => {
      const patientId = 'patient-trends';
      const baseDate = new Date('2024-06-15T00:00:00');

      // Registrar varios episodios
      for (let i = 0; i < 5; i++) {
        const timestamp = new Date(baseDate);
        timestamp.setHours(timestamp.getHours() + i * 3);
        await manager.recordIncontinenceEpisode(
          patientId,
          timestamp,
          IncontinenceSeverity.MODERATE
        );
      }

      const analysis = await manager.analyzePatterns(patientId, {
        start: new Date('2024-06-01'),
        end: new Date('2024-06-30'),
      });

      expect(analysis.trends).toBeDefined();
      expect(analysis.trends.length).toBeGreaterThan(0);
      expect(analysis.totalEvents).toBe(5);
    });
  });

  describe('recordBathroomVisit', () => {
    it('debe registrar visita al baño con timestamp', async () => {
      const patientId = 'patient-bathroom';
      const timestamp = new Date('2024-06-15T08:30:00');
      const success = true;

      const result = await manager.recordBathroomVisit(patientId, timestamp, success, 'Test visit');

      expect(result.ok).toBe(true);

      // Verificar que se guardó el evento
      const events = Object.values(mockStorage.incontinenceEvents) as IncontinenceEvent[];
      expect(events.length).toBe(1);
      expect(events[0].patientId).toBe(patientId);
      expect(events[0].type).toBe(IncontinenceEventType.BATHROOM_VISIT);
      expect(events[0].success).toBe(success);
      expect(new Date(events[0].occurredAt).getTime()).toBe(timestamp.getTime());
    });

    it('debe rechazar registro sin patientId', async () => {
      const result = await manager.recordBathroomVisit('', new Date());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });
  });

  describe('recordIncontinenceEpisode', () => {
    it('debe registrar episodio con severidad', async () => {
      const patientId = 'patient-episode';
      const timestamp = new Date('2024-06-15T14:00:00');
      const severity = IncontinenceSeverity.MAJOR;

      const result = await manager.recordIncontinenceEpisode(
        patientId,
        timestamp,
        severity,
        'Severe episode'
      );

      expect(result.ok).toBe(true);

      // Verificar que se guardó el evento
      const events = Object.values(mockStorage.incontinenceEvents) as IncontinenceEvent[];
      expect(events.length).toBe(1);
      expect(events[0].patientId).toBe(patientId);
      expect(events[0].type).toBe(IncontinenceEventType.EPISODE);
      expect(events[0].severity).toBe(severity);
      expect(new Date(events[0].occurredAt).getTime()).toBe(timestamp.getTime());
    });

    it('debe permitir registro sin severidad especificada', async () => {
      const patientId = 'patient-no-severity';
      const timestamp = new Date();

      const result = await manager.recordIncontinenceEpisode(patientId, timestamp);

      expect(result.ok).toBe(true);

      const events = Object.values(mockStorage.incontinenceEvents) as IncontinenceEvent[];
      expect(events[0].severity).toBeUndefined();
    });
  });

  describe('analyzePatterns', () => {
    it('debe calcular promedio diario correctamente', async () => {
      const patientId = 'patient-average';
      const startDate = new Date('2024-06-01T00:00:00');
      const endDate = new Date('2024-06-10T23:59:59'); // 10 días

      // Registrar 20 eventos (promedio de 2 por día)
      for (let i = 0; i < 20; i++) {
        const timestamp = new Date(startDate);
        timestamp.setHours(timestamp.getHours() + i * 12);
        await manager.recordIncontinenceEpisode(patientId, timestamp);
      }

      const analysis = await manager.analyzePatterns(patientId, {
        start: startDate,
        end: endDate,
      });

      expect(analysis.totalEvents).toBe(20);
      expect(analysis.averagePerDay).toBeCloseTo(2, 1);
    });

    it('debe filtrar eventos por rango de fechas', async () => {
      const patientId = 'patient-date-filter';

      // Registrar eventos en diferentes fechas
      await manager.recordIncontinenceEpisode(patientId, new Date('2024-05-15T10:00:00'));
      await manager.recordIncontinenceEpisode(patientId, new Date('2024-06-15T10:00:00'));
      await manager.recordIncontinenceEpisode(patientId, new Date('2024-07-15T10:00:00'));

      // Analizar solo junio
      const analysis = await manager.analyzePatterns(patientId, {
        start: new Date('2024-06-01'),
        end: new Date('2024-06-30'),
      });

      // Solo debe contar el evento de junio
      expect(analysis.totalEvents).toBe(1);
    });

    it('debe identificar patrones por hora del día', async () => {
      const patientId = 'patient-hourly-pattern';
      const baseDate = new Date('2024-06-15T00:00:00');

      // Registrar múltiples eventos a las 10:00
      for (let i = 0; i < 5; i++) {
        const timestamp = new Date(baseDate);
        timestamp.setDate(timestamp.getDate() + i);
        timestamp.setHours(10);
        await manager.recordIncontinenceEpisode(patientId, timestamp);
      }

      const analysis = await manager.analyzePatterns(patientId, {
        start: new Date('2024-06-01'),
        end: new Date('2024-06-30'),
      });

      // Debe identificar la hora de mayor frecuencia
      const hasHourlyPattern = analysis.trends.some((trend) => /10:00/.test(trend));
      expect(hasHourlyPattern).toBe(true);
    });
  });
});
