/**
 * Property-Based Tests for HistoryService
 * Tests universal properties that must hold for all inputs
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  HistoryService,
  getHistoryService,
  resetHistoryService,
} from './HistoryService';
import { CareEvent } from '../types/models';
import { CareEventType, SyncStatus } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';

describe('HistoryService - Property-Based Tests', () => {
  let historyService: HistoryService;

  beforeEach(async () => {
    resetHistoryService();
    historyService = getHistoryService();
    await IndexedDBUtils.initDB();
  });

  afterEach(async () => {
    await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);
  });

  describe('Propiedad 22: Orden cronológico del historial', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 22: Orden cronológico del historial
     * Valida: Requisitos 9.2
     *
     * Para cualquier consulta de historial de eventos, el sistema debe devolver
     * los eventos ordenados cronológicamente (más reciente primero o más antiguo
     * primero según configuración).
     */
    it('debe devolver eventos ordenados cronológicamente independientemente del orden de inserción', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              eventType: fc.constantFrom(
                CareEventType.MEDICATION,
                CareEventType.FALL,
                CareEventType.POSTURAL_CHANGE,
                CareEventType.NUTRITION,
                CareEventType.INCONTINENCE,
                CareEventType.RESTRAINT,
                CareEventType.ASSESSMENT
              ),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
              syncStatus: fc.constantFrom(
                SyncStatus.PENDING,
                SyncStatus.SYNCED,
                SyncStatus.CONFLICT
              ),
            }),
            { minLength: 2, maxLength: 50 }
          ),
          async (eventsData) => {
            // Limpiar store antes de cada propiedad
            await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);

            // Crear eventos con timestamps únicos
            const events: CareEvent[] = eventsData.map((data) => ({
              id: data.id,
              patientId: data.patientId,
              eventType: data.eventType,
              timestamp: new Date(data.timestampMs),
              performedBy: data.performedBy,
              syncStatus: data.syncStatus,
              metadata: {},
              createdAt: new Date(data.timestampMs),
            }));

            // Guardar eventos en orden aleatorio
            const shuffled = [...events].sort(() => Math.random() - 0.5);
            for (const event of shuffled) {
              await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);
            }

            // Obtener historial en orden descendente (más reciente primero)
            const resultDesc = await historyService.getHistory(undefined, 'DESC');
            expect(resultDesc.ok).toBe(true);

            if (resultDesc.ok) {
              const historyDesc = resultDesc.value;

              // Verificar orden descendente
              for (let i = 1; i < historyDesc.length; i++) {
                const prevTime = new Date(historyDesc[i - 1].timestamp).getTime();
                const currTime = new Date(historyDesc[i].timestamp).getTime();
                if (prevTime < currTime) {
                  return false; // Orden incorrecto
                }
              }
            }

            // Obtener historial en orden ascendente (más antiguo primero)
            const resultAsc = await historyService.getHistory(undefined, 'ASC');
            expect(resultAsc.ok).toBe(true);

            if (resultAsc.ok) {
              const historyAsc = resultAsc.value;

              // Verificar orden ascendente
              for (let i = 1; i < historyAsc.length; i++) {
                const prevTime = new Date(historyAsc[i - 1].timestamp).getTime();
                const currTime = new Date(historyAsc[i].timestamp).getTime();
                if (prevTime > currTime) {
                  return false; // Orden incorrecto
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe mantener orden cronológico para eventos del mismo paciente', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // patientId fijo
          fc.array(
            fc.record({
              id: fc.uuid(),
              eventType: fc.constantFrom(
                CareEventType.MEDICATION,
                CareEventType.FALL,
                CareEventType.POSTURAL_CHANGE
              ),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 2, maxLength: 30 }
          ),
          async (patientId, eventsData) => {
            // Limpiar store
            await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);

            // Crear eventos para el mismo paciente
            const events: CareEvent[] = eventsData.map((data) => ({
              id: data.id,
              patientId: patientId,
              eventType: data.eventType,
              timestamp: new Date(data.timestampMs),
              performedBy: data.performedBy,
              syncStatus: SyncStatus.SYNCED,
              metadata: {},
              createdAt: new Date(data.timestampMs),
            }));

            // Guardar en orden aleatorio
            const shuffled = [...events].sort(() => Math.random() - 0.5);
            for (const event of shuffled) {
              await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);
            }

            // Obtener historial del paciente
            const result = await historyService.getHistory(patientId, 'DESC');
            expect(result.ok).toBe(true);

            if (result.ok) {
              const history = result.value;

              // Verificar que todos los eventos son del paciente correcto
              const allCorrectPatient = history.every((e) => e.patientId === patientId);
              if (!allCorrectPatient) {
                return false;
              }

              // Verificar orden descendente
              for (let i = 1; i < history.length; i++) {
                const prevTime = new Date(history[i - 1].timestamp).getTime();
                const currTime = new Date(history[i].timestamp).getTime();
                if (prevTime < currTime) {
                  return false;
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Propiedad 23: Preservación de timestamps en exportación', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 23: Preservación de timestamps en exportación
     * Valida: Requisitos 9.3
     *
     * Para cualquier exportación de datos, el sistema debe incluir todas las
     * marcas temporales de los eventos exportados en el formato de salida.
     */
    it('debe preservar timestamps en exportación JSON', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              eventType: fc.constantFrom(
                CareEventType.MEDICATION,
                CareEventType.FALL,
                CareEventType.POSTURAL_CHANGE
              ),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              createdAtMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (eventsData) => {
            // Crear eventos
            const events: CareEvent[] = eventsData.map((data) => ({
              id: data.id,
              patientId: data.patientId,
              eventType: data.eventType,
              timestamp: new Date(data.timestampMs),
              performedBy: data.performedBy,
              syncStatus: SyncStatus.SYNCED,
              metadata: {},
              createdAt: new Date(data.createdAtMs),
            }));

            // Exportar como JSON
            const result = historyService.exportHistoryWithTimestamps(events, 'JSON');
            expect(result.ok).toBe(true);

            if (result.ok) {
              const exported = result.value;

              // Parsear el contenido JSON
              const parsed = JSON.parse(exported.content);

              // Verificar que todos los timestamps están presentes
              for (let i = 0; i < events.length; i++) {
                const originalEvent = events[i];
                const exportedEvent = parsed[i];

                // Verificar timestamp
                const originalTimestamp = originalEvent.timestamp.toISOString();
                if (exportedEvent.timestamp !== originalTimestamp) {
                  return false;
                }

                // Verificar createdAt
                const originalCreatedAt = originalEvent.createdAt.toISOString();
                if (exportedEvent.createdAt !== originalCreatedAt) {
                  return false;
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe preservar timestamps en exportación CSV', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              eventType: fc.constantFrom(
                CareEventType.MEDICATION,
                CareEventType.FALL,
                CareEventType.POSTURAL_CHANGE
              ),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              createdAtMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (eventsData) => {
            // Crear eventos
            const events: CareEvent[] = eventsData.map((data) => ({
              id: data.id,
              patientId: data.patientId,
              eventType: data.eventType,
              timestamp: new Date(data.timestampMs),
              performedBy: data.performedBy,
              syncStatus: SyncStatus.SYNCED,
              metadata: {},
              createdAt: new Date(data.createdAtMs),
            }));

            // Exportar como CSV
            const result = historyService.exportHistoryWithTimestamps(events, 'CSV');
            expect(result.ok).toBe(true);

            if (result.ok) {
              const exported = result.value;
              const csvContent = exported.content;

              // Verificar que todos los timestamps están en el CSV
              for (const event of events) {
                const timestampISO = event.timestamp.toISOString();
                const createdAtISO = event.createdAt.toISOString();

                if (!csvContent.includes(timestampISO)) {
                  return false;
                }

                if (!csvContent.includes(createdAtISO)) {
                  return false;
                }
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Propiedad 24: Inmutabilidad de registros históricos', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 24: Inmutabilidad de registros históricos
     * Valida: Requisitos 9.4
     *
     * Para cualquier registro histórico (más de 24 horas de antigüedad), el sistema
     * debe impedir su modificación o eliminación.
     */
    it('debe bloquear modificación de eventos con más de 24 horas de antigüedad', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            patientId: fc.uuid(),
            eventType: fc.constantFrom(
              CareEventType.MEDICATION,
              CareEventType.FALL,
              CareEventType.POSTURAL_CHANGE
            ),
            hoursOld: fc.integer({ min: 25, max: 1000 }), // Más de 24 horas
            performedBy: fc.string({ minLength: 5, maxLength: 50 }),
          }),
          async (eventData) => {
            // Limpiar store
            await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);

            // Crear evento antiguo
            const createdAt = new Date(Date.now() - eventData.hoursOld * 60 * 60 * 1000);
            const event: CareEvent = {
              id: eventData.id,
              patientId: eventData.patientId,
              eventType: eventData.eventType,
              timestamp: createdAt,
              performedBy: eventData.performedBy,
              syncStatus: SyncStatus.SYNCED,
              metadata: {},
              createdAt: createdAt,
            };

            // Guardar evento
            await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);

            // Intentar modificar
            const updateResult = await historyService.updateEvent(event.id, {
              syncStatus: SyncStatus.PENDING,
            });

            // Debe fallar
            if (updateResult.ok) {
              return false; // No debería permitir actualización
            }

            // Verificar que el error es el correcto
            if (updateResult.error.message.includes('más de 24 horas')) {
              return true;
            }

            return false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe bloquear eliminación de eventos con más de 24 horas de antigüedad', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            patientId: fc.uuid(),
            eventType: fc.constantFrom(
              CareEventType.MEDICATION,
              CareEventType.FALL,
              CareEventType.POSTURAL_CHANGE
            ),
            hoursOld: fc.integer({ min: 25, max: 1000 }), // Más de 24 horas
            performedBy: fc.string({ minLength: 5, maxLength: 50 }),
          }),
          async (eventData) => {
            // Limpiar store
            await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);

            // Crear evento antiguo
            const createdAt = new Date(Date.now() - eventData.hoursOld * 60 * 60 * 1000);
            const event: CareEvent = {
              id: eventData.id,
              patientId: eventData.patientId,
              eventType: eventData.eventType,
              timestamp: createdAt,
              performedBy: eventData.performedBy,
              syncStatus: SyncStatus.SYNCED,
              metadata: {},
              createdAt: createdAt,
            };

            // Guardar evento
            await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);

            // Intentar eliminar
            const deleteResult = await historyService.deleteEvent(event.id);

            // Debe fallar
            if (deleteResult.ok) {
              return false; // No debería permitir eliminación
            }

            // Verificar que el evento todavía existe
            const stillExists = await IndexedDBUtils.getById(
              IndexedDBUtils.STORES.CARE_EVENTS,
              event.id
            );

            return stillExists !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe permitir modificación de eventos con menos de 24 horas de antigüedad', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            patientId: fc.uuid(),
            eventType: fc.constantFrom(
              CareEventType.MEDICATION,
              CareEventType.FALL,
              CareEventType.POSTURAL_CHANGE
            ),
            hoursOld: fc.integer({ min: 0, max: 23 }), // Menos de 24 horas
            performedBy: fc.string({ minLength: 5, maxLength: 50 }),
          }),
          async (eventData) => {
            // Limpiar store
            await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);

            // Crear evento reciente
            const createdAt = new Date(Date.now() - eventData.hoursOld * 60 * 60 * 1000);
            const event: CareEvent = {
              id: eventData.id,
              patientId: eventData.patientId,
              eventType: eventData.eventType,
              timestamp: createdAt,
              performedBy: eventData.performedBy,
              syncStatus: SyncStatus.PENDING,
              metadata: {},
              createdAt: createdAt,
            };

            // Guardar evento
            await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);

            // Intentar modificar
            const updateResult = await historyService.updateEvent(event.id, {
              syncStatus: SyncStatus.SYNCED,
            });

            // Debe tener éxito
            return updateResult.ok === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Propiedad 25: Filtrado de registros', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 25: Filtrado de registros
     * Valida: Requisitos 9.5
     *
     * Para cualquier filtro aplicado (tipo de evento, rango de fechas), el sistema
     * debe devolver solo registros que cumplan todos los criterios del filtro.
     */
    it('debe filtrar correctamente por tipo de evento', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              eventType: fc.constantFrom(
                CareEventType.MEDICATION,
                CareEventType.FALL,
                CareEventType.POSTURAL_CHANGE,
                CareEventType.NUTRITION,
                CareEventType.INCONTINENCE
              ),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 5, maxLength: 30 }
          ),
          fc.constantFrom(
            CareEventType.MEDICATION,
            CareEventType.FALL,
            CareEventType.POSTURAL_CHANGE
          ),
          (eventsData, filterType) => {
            // Crear eventos
            const events: CareEvent[] = eventsData.map((data) => ({
              id: data.id,
              patientId: data.patientId,
              eventType: data.eventType,
              timestamp: new Date(data.timestampMs),
              performedBy: data.performedBy,
              syncStatus: SyncStatus.SYNCED,
              metadata: {},
              createdAt: new Date(data.timestampMs),
            }));

            // Filtrar por tipo
            const filtered = historyService.filterByEventType(events, filterType);

            // Verificar que todos los eventos filtrados son del tipo correcto
            return filtered.every((event) => event.eventType === filterType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe filtrar correctamente por rango de fechas', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              eventType: fc.constantFrom(
                CareEventType.MEDICATION,
                CareEventType.FALL,
                CareEventType.POSTURAL_CHANGE
              ),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 5, maxLength: 30 }
          ),
          fc.record({
            startMs: fc.integer({
              min: new Date('2020-01-01').getTime(),
              max: new Date('2025-12-31').getTime(),
            }),
            endMs: fc.integer({
              min: new Date('2025-01-01').getTime(),
              max: new Date('2030-12-31').getTime(),
            }),
          }),
          (eventsData, dateRangeData) => {
            // Asegurar que start < end
            const startMs = Math.min(dateRangeData.startMs, dateRangeData.endMs);
            const endMs = Math.max(dateRangeData.startMs, dateRangeData.endMs);

            // Crear eventos
            const events: CareEvent[] = eventsData.map((data) => ({
              id: data.id,
              patientId: data.patientId,
              eventType: data.eventType,
              timestamp: new Date(data.timestampMs),
              performedBy: data.performedBy,
              syncStatus: SyncStatus.SYNCED,
              metadata: {},
              createdAt: new Date(data.timestampMs),
            }));

            // Filtrar por rango de fechas
            const filtered = historyService.filterByDateRange(events, {
              start: new Date(startMs),
              end: new Date(endMs),
            });

            // Verificar que todos los eventos filtrados están dentro del rango
            return filtered.every((event) => {
              const eventTime = new Date(event.timestamp).getTime();
              return eventTime >= startMs && eventTime <= endMs;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe aplicar múltiples filtros correctamente', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // patientId
          fc.array(
            fc.record({
              id: fc.uuid(),
              eventType: fc.constantFrom(
                CareEventType.MEDICATION,
                CareEventType.FALL,
                CareEventType.POSTURAL_CHANGE,
                CareEventType.NUTRITION
              ),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 10, maxLength: 30 }
          ),
          fc.constantFrom(CareEventType.MEDICATION, CareEventType.FALL),
          fc.record({
            startMs: fc.integer({
              min: new Date('2020-01-01').getTime(),
              max: new Date('2025-12-31').getTime(),
            }),
            endMs: fc.integer({
              min: new Date('2025-01-01').getTime(),
              max: new Date('2030-12-31').getTime(),
            }),
          }),
          async (patientId, eventsData, filterType, dateRangeData) => {
            // Limpiar store
            await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);

            // Asegurar que start < end
            const startMs = Math.min(dateRangeData.startMs, dateRangeData.endMs);
            const endMs = Math.max(dateRangeData.startMs, dateRangeData.endMs);

            // Crear eventos para el paciente
            const events: CareEvent[] = eventsData.map((data) => ({
              id: data.id,
              patientId: patientId,
              eventType: data.eventType,
              timestamp: new Date(data.timestampMs),
              performedBy: data.performedBy,
              syncStatus: SyncStatus.SYNCED,
              metadata: {},
              createdAt: new Date(data.timestampMs),
            }));

            // Guardar eventos
            for (const event of events) {
              await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);
            }

            // Aplicar filtros
            const result = await historyService.getFilteredHistory({
              patientId: patientId,
              eventType: filterType,
              dateRange: {
                start: new Date(startMs),
                end: new Date(endMs),
              },
            });

            expect(result.ok).toBe(true);

            if (result.ok) {
              const filtered = result.value;

              // Verificar que todos los eventos cumplen TODOS los criterios
              return filtered.every((event) => {
                const eventTime = new Date(event.timestamp).getTime();
                return (
                  event.patientId === patientId &&
                  event.eventType === filterType &&
                  eventTime >= startMs &&
                  eventTime <= endMs
                );
              });
            }

            return false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
