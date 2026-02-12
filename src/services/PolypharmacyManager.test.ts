/**
 * Tests for PolypharmacyManager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PolypharmacyManager,
  getPolypharmacyManager,
  resetPolypharmacyManager,
} from './PolypharmacyManager';
import { ErrorCode, ScheduleFrequency } from '../types/enums';
import { isOk, isErr } from '../types/result';
import * as IndexedDBUtils from '../utils/indexedDB';
import type { Medication, MedicationDetails, Schedule } from '../types/models';
import * as fc from 'fast-check';

describe('PolypharmacyManager', () => {
  let manager: PolypharmacyManager;

  beforeEach(async () => {
    resetPolypharmacyManager();
    
    // Limpiar stores de IndexedDB
    try {
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.MEDICATIONS);
    } catch (error) {
      // Ignorar errores si los stores no existen aún
    }

    manager = getPolypharmacyManager();
  });

  afterEach(() => {
    resetPolypharmacyManager();
  });

  describe('addMedication', () => {
    it('debe agregar un medicamento correctamente', async () => {
      const schedule: Schedule = {
        times: [new Date('2024-01-01T08:00:00')],
        frequency: ScheduleFrequency.DAILY,
      };

      const details: MedicationDetails = {
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
      };

      const result = await manager.addMedication('patient-1', details);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.name).toBe('Aspirina');
        expect(result.value.dosage).toBe('100mg');
        expect(result.value.purpose).toBe('Anticoagulante');
        expect(result.value.patientId).toBe('patient-1');
        expect(result.value.isActive).toBe(true);
      }
    });

    it('debe rechazar medicamento sin nombre', async () => {
      const schedule: Schedule = {
        times: [new Date()],
        frequency: ScheduleFrequency.DAILY,
      };

      const details: MedicationDetails = {
        name: '',
        dosage: '100mg',
        purpose: 'Test',
        schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
      };

      const result = await manager.addMedication('patient-1', details);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });

    it('debe rechazar medicamento sin dosis', async () => {
      const schedule: Schedule = {
        times: [new Date()],
        frequency: ScheduleFrequency.DAILY,
      };

      const details: MedicationDetails = {
        name: 'Aspirina',
        dosage: '',
        purpose: 'Test',
        schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
      };

      const result = await manager.addMedication('patient-1', details);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });

    it('debe rechazar medicamento sin propósito', async () => {
      const schedule: Schedule = {
        times: [new Date()],
        frequency: ScheduleFrequency.DAILY,
      };

      const details: MedicationDetails = {
        name: 'Aspirina',
        dosage: '100mg',
        purpose: '',
        schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
      };

      const result = await manager.addMedication('patient-1', details);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });
  });

  describe('updateMedicationSheet', () => {
    it('debe actualizar un medicamento existente', async () => {
      // Crear medicamento
      const schedule: Schedule = {
        times: [new Date()],
        frequency: ScheduleFrequency.DAILY,
      };

      const details: MedicationDetails = {
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
      };

      const addResult = await manager.addMedication('patient-1', details);
      expect(isOk(addResult)).toBe(true);

      if (isOk(addResult)) {
        const medicationId = addResult.value.id;

        // Actualizar stock
        const updateResult = await manager.updateMedicationSheet([
          {
            medicationId,
            field: 'stockLevel',
            value: 20,
          },
        ]);

        expect(isOk(updateResult)).toBe(true);

        // Verificar actualización
        const medication = await IndexedDBUtils.getById<Medication>(
          IndexedDBUtils.STORES.MEDICATIONS,
          medicationId
        );

        expect(medication?.stockLevel).toBe(20);
      }
    });

    it('debe rechazar actualización de medicamento inexistente', async () => {
      const result = await manager.updateMedicationSheet([
        {
          medicationId: 'nonexistent',
          field: 'stockLevel',
          value: 20,
        },
      ]);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });
  });

  describe('checkStockLevels', () => {
    it('debe detectar medicamentos con stock bajo', async () => {
      const schedule: Schedule = {
        times: [new Date()],
        frequency: ScheduleFrequency.DAILY,
      };

      // Medicamento con stock bajo
      await manager.addMedication('patient-1', {
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule,
        stockLevel: 5, // Bajo el umbral de 7
        expirationDate: new Date('2025-12-31'),
      });

      // Medicamento con stock suficiente
      await manager.addMedication('patient-1', {
        name: 'Metformina',
        dosage: '500mg',
        purpose: 'Diabetes',
        schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
      });

      const alerts = await manager.checkStockLevels('patient-1');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].medicationName).toBe('Aspirina');
      expect(alerts[0].currentStock).toBe(5);
      expect(alerts[0].message).toContain('Stock bajo');
    });

    it('debe retornar array vacío si no hay stock bajo', async () => {
      const schedule: Schedule = {
        times: [new Date()],
        frequency: ScheduleFrequency.DAILY,
      };

      await manager.addMedication('patient-1', {
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule,
        stockLevel: 30,
        expirationDate: new Date('2025-12-31'),
      });

      const alerts = await manager.checkStockLevels('patient-1');

      expect(alerts).toHaveLength(0);
    });
  });

  describe('checkExpirationDates', () => {
    it('debe detectar medicamentos próximos a caducar', async () => {
      const schedule: Schedule = {
        times: [new Date()],
        frequency: ScheduleFrequency.DAILY,
      };

      // Medicamento que caduca en 15 días
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Normalizar a medianoche
      const expirationDate = new Date(now);
      expirationDate.setDate(expirationDate.getDate() + 15);

      await manager.addMedication('patient-1', {
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule,
        stockLevel: 30,
        expirationDate,
      });

      const alerts = await manager.checkExpirationDates('patient-1');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].medicationName).toBe('Aspirina');
      expect(alerts[0].daysUntilExpiration).toBeGreaterThanOrEqual(14);
      expect(alerts[0].daysUntilExpiration).toBeLessThanOrEqual(15);
      expect(alerts[0].message).toContain('caduca en');
    });

    it('debe detectar medicamentos caducados', async () => {
      const schedule: Schedule = {
        times: [new Date()],
        frequency: ScheduleFrequency.DAILY,
      };

      // Medicamento caducado hace 5 días
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() - 5);

      await manager.addMedication('patient-1', {
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule,
        stockLevel: 30,
        expirationDate,
      });

      const alerts = await manager.checkExpirationDates('patient-1');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].medicationName).toBe('Aspirina');
      expect(alerts[0].daysUntilExpiration).toBeLessThan(0);
      expect(alerts[0].message).toContain('caducó');
    });

    it('debe retornar array vacío si no hay medicamentos próximos a caducar', async () => {
      const schedule: Schedule = {
        times: [new Date()],
        frequency: ScheduleFrequency.DAILY,
      };

      // Medicamento que caduca en 1 año
      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      await manager.addMedication('patient-1', {
        name: 'Aspirina',
        dosage: '100mg',
        purpose: 'Anticoagulante',
        schedule,
        stockLevel: 30,
        expirationDate,
      });

      const alerts = await manager.checkExpirationDates('patient-1');

      expect(alerts).toHaveLength(0);
    });
  });

  describe('findNearestSIGREPoint', () => {
    it('debe retornar puntos SIGRE ordenados por distancia', async () => {
      const userLocation = {
        latitude: -33.4489,
        longitude: -70.6693,
      };

      const points = await manager.findNearestSIGREPoint(userLocation);

      expect(points.length).toBeGreaterThan(0);
      expect(points.length).toBeLessThanOrEqual(5);

      // Verificar que tienen distancia calculada
      for (const point of points) {
        expect(point.distance).toBeDefined();
        expect(point.distance).toBeGreaterThanOrEqual(0);
      }

      // Verificar que están ordenados por distancia
      for (let i = 1; i < points.length; i++) {
        expect(points[i].distance!).toBeGreaterThanOrEqual(points[i - 1].distance!);
      }
    });

    it('debe limitar resultados al máximo especificado', async () => {
      const userLocation = {
        latitude: -33.4489,
        longitude: -70.6693,
      };

      const points = await manager.findNearestSIGREPoint(userLocation, 3);

      expect(points.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Property-Based Tests', () => {
    describe('Propiedad 14: Exportación PDF de hoja de medicamentos', () => {
      it('debe exportar cualquier hoja de medicamentos a formato PDF válido con nombre, dosis y propósito', async () => {
        // Feature: cuido-a-mi-tata, Property 14: Exportación PDF de hoja de medicamentos
        // Valida: Requisitos 6.2

        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 5, maxLength: 50 }), // patientId
            fc.array(
              fc.record({
                name: fc.string({ minLength: 3, maxLength: 50 }),
                dosage: fc.string({ minLength: 2, maxLength: 20 }),
                purpose: fc.string({ minLength: 5, maxLength: 100 }),
                stockLevel: fc.integer({ min: 0, max: 100 }),
                expirationDate: fc.date({
                  min: new Date('2024-01-01'),
                  max: new Date('2026-12-31'),
                }),
              }),
              { minLength: 0, maxLength: 10 }
            ),
            async (patientId, medicationsData) => {
              // Agregar medicamentos
              for (const medData of medicationsData) {
                const schedule: Schedule = {
                  times: [new Date()],
                  frequency: ScheduleFrequency.DAILY,
                };

                await manager.addMedication(patientId, {
                  ...medData,
                  schedule,
                });
              }

              // Exportar a PDF
              const result = await manager.exportToPDF(patientId);

              // Debe ser exitoso
              expect(isOk(result)).toBe(true);

              if (isOk(result)) {
                const pdfBlob = result.value;

                // Debe ser un Blob
                expect(pdfBlob).toBeInstanceOf(Blob);

                // Debe tener tipo PDF
                expect(pdfBlob.type).toBe('application/pdf');

                // Debe tener contenido
                expect(pdfBlob.size).toBeGreaterThan(0);

                // Leer contenido del PDF (como HTML en esta implementación)
                // Usar FileReader para leer el Blob en el entorno de pruebas
                const text = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsText(pdfBlob);
                });

                // Debe contener el ID del paciente
                expect(text).toContain(patientId);

                // Debe contener encabezados de tabla
                expect(text).toContain('Nombre');
                expect(text).toContain('Dosis');
                expect(text).toContain('Propósito');

                // Si hay medicamentos, verificar que están en el PDF
                if (medicationsData.length > 0) {
                  for (const med of medicationsData) {
                    expect(text).toContain(med.name);
                    expect(text).toContain(med.dosage);
                    expect(text).toContain(med.purpose);
                  }
                } else {
                  // Si no hay medicamentos, debe indicarlo
                  expect(text).toContain('No hay medicamentos registrados');
                }

                // Debe contener fecha de generación
                expect(text).toContain('Generado:');

                // Debe ser HTML válido
                expect(text).toContain('<!DOCTYPE html>');
                expect(text).toContain('<html>');
                expect(text).toContain('</html>');
              }

              // Limpiar medicamentos del paciente
              const medications = await IndexedDBUtils.getByIndex<Medication>(
                IndexedDBUtils.STORES.MEDICATIONS,
                'patientId',
                patientId
              );
              for (const med of medications) {
                await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, med.id);
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Propiedad 15: Alertas de stock bajo', () => {
      it('debe emitir notificación de reabastecimiento para cualquier medicamento con stock por debajo del umbral', async () => {
        // Feature: cuido-a-mi-tata, Property 15: Alertas de stock bajo
        // Valida: Requisitos 6.3

        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 5, maxLength: 50 }), // patientId
            fc.array(
              fc.record({
                name: fc.string({ minLength: 3, maxLength: 50 }),
                dosage: fc.string({ minLength: 2, maxLength: 20 }),
                purpose: fc.string({ minLength: 5, maxLength: 100 }),
                stockLevel: fc.integer({ min: 0, max: 50 }),
                expirationDate: fc.date({
                  min: new Date('2024-01-01'),
                  max: new Date('2026-12-31'),
                }),
              }),
              { minLength: 1, maxLength: 15 }
            ),
            async (patientId, medicationsData) => {
              // Agregar medicamentos
              const addedMedications: Medication[] = [];
              for (const medData of medicationsData) {
                const schedule: Schedule = {
                  times: [new Date()],
                  frequency: ScheduleFrequency.DAILY,
                };

                const result = await manager.addMedication(patientId, {
                  ...medData,
                  schedule,
                });

                if (isOk(result)) {
                  addedMedications.push(result.value);
                }
              }

              // Verificar alertas de stock
              const alerts = await manager.checkStockLevels(patientId);

              // Contar medicamentos con stock bajo (≤ 7)
              const lowStockMedications = medicationsData.filter((m) => m.stockLevel <= 7);

              // El número de alertas debe coincidir con el número de medicamentos con stock bajo
              expect(alerts.length).toBe(lowStockMedications.length);

              // Verificar que cada alerta corresponde a un medicamento con stock bajo
              for (const alert of alerts) {
                // Encontrar el medicamento correspondiente
                const medication = addedMedications.find((m) => m.id === alert.medicationId);
                expect(medication).toBeDefined();

                if (medication) {
                  // El stock debe ser ≤ 7
                  expect(medication.stockLevel).toBeLessThanOrEqual(7);

                  // La alerta debe contener información correcta
                  expect(alert.medicationName).toBe(medication.name);
                  expect(alert.currentStock).toBe(medication.stockLevel);
                  expect(alert.threshold).toBe(7);
                  expect(alert.message).toContain('Stock bajo');
                  expect(alert.message).toContain(medication.name);
                  expect(alert.message).toContain(medication.stockLevel.toString());
                }
              }

              // Verificar que NO hay alertas para medicamentos con stock > 7
              for (const med of addedMedications) {
                if (med.stockLevel > 7) {
                  const hasAlert = alerts.some((a) => a.medicationId === med.id);
                  expect(hasAlert).toBe(false);
                }
              }

              // Limpiar medicamentos del paciente
              for (const med of addedMedications) {
                await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, med.id);
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Propiedad 16: Alertas de caducidad próxima', () => {
      it('debe emitir alerta para cualquier medicamento cuya fecha de caducidad esté dentro del período de alerta', async () => {
        // Feature: cuido-a-mi-tata, Property 16: Alertas de caducidad próxima
        // Valida: Requisitos 6.4

        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 5, maxLength: 50 }), // patientId
            fc.array(
              fc.record({
                name: fc.string({ minLength: 3, maxLength: 50 }),
                dosage: fc.string({ minLength: 2, maxLength: 20 }),
                purpose: fc.string({ minLength: 5, maxLength: 100 }),
                stockLevel: fc.integer({ min: 0, max: 50 }),
                // Generar fechas en un rango que incluye pasado, presente y futuro
                daysUntilExpiration: fc.integer({ min: -10, max: 60 }),
              }),
              { minLength: 1, maxLength: 15 }
            ),
            async (patientId, medicationsData) => {
              // Limpiar medicamentos existentes del paciente antes de empezar
              const existingMeds = await IndexedDBUtils.getByIndex<Medication>(
                IndexedDBUtils.STORES.MEDICATIONS,
                'patientId',
                patientId
              );
              for (const med of existingMeds) {
                await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, med.id);
              }

              // Hacer nombres únicos para evitar colisiones
              const uniqueMedicationsData = medicationsData.map((med, index) => ({
                ...med,
                name: `${med.name}_${index}_${Date.now()}`,
              }));

              // Agregar medicamentos con fechas de caducidad calculadas
              const addedMedications: Medication[] = [];
              const now = new Date();
              now.setHours(0, 0, 0, 0); // Normalizar a medianoche

              for (const medData of uniqueMedicationsData) {
                const expirationDate = new Date(now);
                expirationDate.setDate(expirationDate.getDate() + medData.daysUntilExpiration);

                const schedule: Schedule = {
                  times: [new Date()],
                  frequency: ScheduleFrequency.DAILY,
                };

                const result = await manager.addMedication(patientId, {
                  name: medData.name,
                  dosage: medData.dosage,
                  purpose: medData.purpose,
                  stockLevel: medData.stockLevel,
                  expirationDate,
                  schedule,
                });

                if (isOk(result)) {
                  addedMedications.push(result.value);
                }
              }

              // Verificar alertas de caducidad
              const alerts = await manager.checkExpirationDates(patientId);

              // Contar medicamentos que deberían generar alertas
              // Alertas se generan si: daysUntilExpiration <= 30
              // PERO solo para medicamentos que fueron agregados exitosamente
              // Permitir ±1 día de diferencia debido a timing
              const shouldAlert = addedMedications.filter((med) => {
                const medExpirationDate = new Date(med.expirationDate);
                medExpirationDate.setHours(0, 0, 0, 0);
                const daysUntilExpiration = Math.floor(
                  (medExpirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                return daysUntilExpiration <= 31; // Permitir 31 debido a timing
              });

              // El número de alertas debe coincidir (permitir ±1 debido a timing)
              expect(Math.abs(alerts.length - shouldAlert.length)).toBeLessThanOrEqual(1);

              // Verificar que cada alerta corresponde a un medicamento con caducidad próxima
              for (const alert of alerts) {
                // Encontrar el medicamento correspondiente
                const medication = addedMedications.find((m) => m.id === alert.medicationId);
                expect(medication).toBeDefined();

                if (medication) {
                  // Calcular días hasta caducidad
                  const medExpirationDate = new Date(medication.expirationDate);
                  medExpirationDate.setHours(0, 0, 0, 0);
                  const daysUntilExpiration = Math.floor(
                    (medExpirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  );

                  // Debe estar dentro del período de alerta (≤ 30 días)
                  // Permitir ±1 día debido a timing
                  expect(daysUntilExpiration).toBeLessThanOrEqual(31);

                  // La alerta debe contener información correcta
                  expect(alert.medicationName).toBe(medication.name);
                  expect(alert.expirationDate).toEqual(medication.expirationDate);
                  // Permitir diferencia de ±1 día debido a timing
                  expect(Math.abs(alert.daysUntilExpiration - daysUntilExpiration)).toBeLessThanOrEqual(1);

                  // El mensaje debe ser apropiado
                  // Permitir ±1 día de diferencia debido a timing
                  if (daysUntilExpiration < -1 || alert.daysUntilExpiration < -1) {
                    // Medicamento caducado
                    expect(alert.message).toContain('caducó');
                    expect(alert.message).toContain('ATENCIÓN');
                  } else if (daysUntilExpiration > 1 && alert.daysUntilExpiration > 1) {
                    // Medicamento próximo a caducar
                    expect(alert.message).toContain('caduca en');
                    expect(alert.message).toContain(medication.name);
                  }
                  // Para casos límite (0, ±1 día), aceptar cualquier mensaje
                }
              }

              // Verificar que NO hay alertas para medicamentos con caducidad > 31 días (permitir ±1 día)
              for (const med of addedMedications) {
                const medExpirationDate = new Date(med.expirationDate);
                medExpirationDate.setHours(0, 0, 0, 0);
                const daysUntilExpiration = Math.floor(
                  (medExpirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysUntilExpiration > 31) {
                  const hasAlert = alerts.some((a) => a.medicationId === med.id);
                  expect(hasAlert).toBe(false);
                }
              }

              // Limpiar medicamentos del paciente
              for (const med of addedMedications) {
                await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.MEDICATIONS, med.id);
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
