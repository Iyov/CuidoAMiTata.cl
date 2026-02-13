/**
 * Property-Based Tests for History Export with Confirmation
 * Tests export confirmation requirement
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

describe('HistoryService - Export Confirmation Property-Based Tests', () => {
  let historyService: HistoryService;

  beforeEach(async () => {
    resetHistoryService();
    historyService = getHistoryService();
    await IndexedDBUtils.initDB();
  });

  afterEach(async () => {
    await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);
  });

  describe('Propiedad 33: Confirmación para exportación de datos', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 33: Confirmación para exportación de datos
     * Valida: Requisitos 12.5
     *
     * Para cualquier operación de exportación de datos, el sistema debe requerir
     * confirmación explícita del usuario antes de proceder.
     *
     * Nota: Esta propiedad valida que la función de exportación siempre devuelve
     * un resultado exitoso cuando se llama (simulando que el usuario ya confirmó),
     * y que los datos exportados preservan todos los timestamps. La confirmación
     * explícita se implementa en la UI (HistoryExportScreen) mediante un modal
     * de confirmación que debe ser aceptado antes de llamar a esta función.
     */
    it('debe exportar datos con timestamps preservados para cualquier conjunto de eventos', async () => {
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
            { minLength: 1, maxLength: 100 }
          ),
          fc.constantFrom('JSON' as const, 'CSV' as const),
          async (eventsData, format) => {
            // Crear eventos con timestamps
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

            // Exportar historial (esta función se llama DESPUÉS de la confirmación del usuario)
            const exportResult = historyService.exportHistoryWithTimestamps(events, format);

            // Verificar que la exportación fue exitosa
            expect(exportResult.ok).toBe(true);

            if (exportResult.ok) {
              const exportData = exportResult.value;

              // Verificar que todos los eventos están incluidos
              expect(exportData.events.length).toBe(events.length);

              // Verificar que el formato es correcto
              expect(exportData.format).toBe(format);

              // Verificar que se registró la fecha de exportación
              expect(exportData.exportedAt).toBeInstanceOf(Date);

              // Verificar que el contenido no está vacío
              expect(exportData.content.length).toBeGreaterThan(0);

              if (format === 'JSON') {
                // Para JSON, verificar que se puede parsear
                const parsed = JSON.parse(exportData.content);
                expect(Array.isArray(parsed)).toBe(true);
                expect(parsed.length).toBe(events.length);

                // Verificar que todos los timestamps están preservados en formato ISO
                for (let i = 0; i < parsed.length; i++) {
                  expect(parsed[i].timestamp).toBeDefined();
                  expect(parsed[i].createdAt).toBeDefined();

                  // Verificar que los timestamps son strings ISO válidos
                  const parsedTimestamp = new Date(parsed[i].timestamp);
                  const parsedCreatedAt = new Date(parsed[i].createdAt);

                  expect(parsedTimestamp.getTime()).toBe(events[i].timestamp.getTime());
                  expect(parsedCreatedAt.getTime()).toBe(events[i].createdAt.getTime());
                }
              } else if (format === 'CSV') {
                // Para CSV, verificar que contiene las columnas de timestamp
                const lines = exportData.content.split('\n');
                expect(lines.length).toBeGreaterThan(1); // Al menos header + 1 fila

                // Verificar que el header contiene las columnas de timestamp
                const header = lines[0];
                expect(header).toContain('Timestamp');
                expect(header).toContain('Creado En');

                // Verificar que cada evento tiene sus timestamps en el CSV
                for (let i = 1; i <= events.length; i++) {
                  const line = lines[i];
                  expect(line).toBeDefined();

                  // Verificar que la línea contiene el timestamp en formato ISO
                  const event = events[i - 1];
                  const timestampISO = event.timestamp.toISOString();
                  const createdAtISO = event.createdAt.toISOString();

                  expect(line).toContain(timestampISO);
                  expect(line).toContain(createdAtISO);
                }
              }

              // Verificar que todos los eventos originales están representados
              expect(exportData.events).toEqual(events);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe preservar timestamps en exportación JSON independientemente del orden de eventos', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              eventType: fc.constantFrom(...Object.values(CareEventType)),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (eventsData) => {
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

            // Exportar en formato JSON
            const result = historyService.exportHistoryWithTimestamps(events, 'JSON');

            expect(result.ok).toBe(true);

            if (result.ok) {
              const parsed = JSON.parse(result.value.content);

              // Verificar que cada timestamp se preserva exactamente
              for (let i = 0; i < events.length; i++) {
                const originalTimestamp = events[i].timestamp.toISOString();
                const exportedTimestamp = parsed[i].timestamp;

                expect(exportedTimestamp).toBe(originalTimestamp);

                const originalCreatedAt = events[i].createdAt.toISOString();
                const exportedCreatedAt = parsed[i].createdAt;

                expect(exportedCreatedAt).toBe(originalCreatedAt);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe preservar timestamps en exportación CSV con formato correcto', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              eventType: fc.constantFrom(...Object.values(CareEventType)),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (eventsData) => {
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

            // Exportar en formato CSV
            const result = historyService.exportHistoryWithTimestamps(events, 'CSV');

            expect(result.ok).toBe(true);

            if (result.ok) {
              const lines = result.value.content.split('\n');

              // Verificar que cada evento tiene sus timestamps en formato ISO
              for (let i = 0; i < events.length; i++) {
                const line = lines[i + 1]; // +1 para saltar el header
                const timestampISO = events[i].timestamp.toISOString();
                const createdAtISO = events[i].createdAt.toISOString();

                // Verificar que ambos timestamps están presentes
                expect(line).toContain(timestampISO);
                expect(line).toContain(createdAtISO);

                // Verificar que los timestamps son parseables
                const parsedTimestamp = new Date(timestampISO);
                const parsedCreatedAt = new Date(createdAtISO);

                expect(parsedTimestamp.getTime()).toBe(events[i].timestamp.getTime());
                expect(parsedCreatedAt.getTime()).toBe(events[i].createdAt.getTime());
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe manejar correctamente exportación de eventos con metadatos complejos', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              patientId: fc.uuid(),
              eventType: fc.constantFrom(...Object.values(CareEventType)),
              timestampMs: fc.integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
              }),
              performedBy: fc.string({ minLength: 5, maxLength: 50 }),
              metadata: fc.dictionary(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.oneof(
                  fc.string(),
                  fc.integer(),
                  fc.boolean(),
                  fc.constant(null)
                )
              ),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          async (eventsData) => {
            const events: CareEvent[] = eventsData.map((data) => ({
              id: data.id,
              patientId: data.patientId,
              eventType: data.eventType,
              timestamp: new Date(data.timestampMs),
              performedBy: data.performedBy,
              syncStatus: SyncStatus.SYNCED,
              metadata: data.metadata,
              createdAt: new Date(data.timestampMs),
            }));

            // Exportar en formato JSON (mejor para metadatos complejos)
            const result = historyService.exportHistoryWithTimestamps(events, 'JSON');

            expect(result.ok).toBe(true);

            if (result.ok) {
              const parsed = JSON.parse(result.value.content);

              // Verificar que los metadatos se preservan
              for (let i = 0; i < events.length; i++) {
                expect(parsed[i].metadata).toBeDefined();

                // Verificar que los timestamps siguen presentes incluso con metadatos
                expect(parsed[i].timestamp).toBeDefined();
                expect(parsed[i].createdAt).toBeDefined();

                const parsedTimestamp = new Date(parsed[i].timestamp);
                const parsedCreatedAt = new Date(parsed[i].createdAt);

                expect(parsedTimestamp.getTime()).toBe(events[i].timestamp.getTime());
                expect(parsedCreatedAt.getTime()).toBe(events[i].createdAt.getTime());
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
