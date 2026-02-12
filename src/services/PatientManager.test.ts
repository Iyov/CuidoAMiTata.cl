/**
 * Unit and Property-Based Tests for PatientManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  PatientManager,
  getPatientManager,
  resetPatientManager,
} from './PatientManager';
import { ErrorCode, RiskFactorType, CareEventType, SyncStatus, Severity } from '../types/enums';
import type { Patient, CareEvent, RiskFactor } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

// Mock IndexedDB utilities con almacenamiento en memoria
const mockStorage: Record<string, Record<string, any>> = {
  patients: {},
  medications: {},
  medicationEvents: {},
  careEvents: {},
  notifications: {},
  syncQueue: {},
  encrypted_data: {},
  fallIncidents: {},
  riskChecklists: {},
  riskAlerts: {},
  posturalChanges: {},
  pressureUlcers: {},
  nutritionEvents: {},
  mealPlans: {},
  incontinenceEvents: {},
};

vi.mock('../utils/indexedDB', () => ({
  STORES: {
    PATIENTS: 'patients',
    MEDICATIONS: 'medications',
    MEDICATION_EVENTS: 'medicationEvents',
    CARE_EVENTS: 'careEvents',
    NOTIFICATIONS: 'notifications',
    SYNC_QUEUE: 'syncQueue',
    ENCRYPTED_DATA: 'encrypted_data',
    FALL_INCIDENTS: 'fallIncidents',
    RISK_CHECKLISTS: 'riskChecklists',
    RISK_ALERTS: 'riskAlerts',
    POSTURAL_CHANGES: 'posturalChanges',
    PRESSURE_ULCERS: 'pressureUlcers',
    NUTRITION_EVENTS: 'nutritionEvents',
    MEAL_PLANS: 'mealPlans',
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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PatientManager', () => {
  let manager: PatientManager;

  beforeEach(() => {
    // Limpiar completamente el almacenamiento mock antes de cada prueba
    Object.keys(mockStorage).forEach((key) => {
      mockStorage[key] = {};
    });

    localStorageMock.clear();
    resetPatientManager();
    manager = getPatientManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createPatientProfile', () => {
    it('debe crear un perfil de paciente con campos válidos', async () => {
      const patient: Patient = {
        id: 'patient-1',
        name: 'Juan Pérez',
        dateOfBirth: new Date('1950-01-15'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await manager.createPatientProfile(patient);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('patient-1');
        expect(result.value.name).toBe('Juan Pérez');
      }
    });

    it('debe rechazar paciente sin nombre', async () => {
      const patient: Patient = {
        id: 'patient-2',
        name: '',
        dateOfBirth: new Date('1950-01-15'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await manager.createPatientProfile(patient);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });

    it('debe rechazar paciente sin fecha de nacimiento', async () => {
      const patient: Patient = {
        id: 'patient-3',
        name: 'María García',
        dateOfBirth: null as any,
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await manager.createPatientProfile(patient);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });
  });

  describe('selectPatient', () => {
    it('debe seleccionar un paciente existente', async () => {
      const patient: Patient = {
        id: 'patient-1',
        name: 'Juan Pérez',
        dateOfBirth: new Date('1950-01-15'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await manager.createPatientProfile(patient);
      const result = await manager.selectPatient('patient-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('patient-1');
      }
      expect(manager.getCurrentPatientId()).toBe('patient-1');
    });

    it('debe rechazar selección de paciente inexistente', async () => {
      const result = await manager.selectPatient('nonexistent');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });
  });

  describe('Property 26: Aislamiento de datos por paciente', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 26: Aislamiento de datos por paciente
     * Valida: Requisitos 10.2, 10.5
     * 
     * Para cualquier paciente seleccionado, el sistema debe mostrar solo datos,
     * alertas y notificaciones que pertenezcan a ese paciente específico.
     */
    it('debe mostrar solo eventos del paciente seleccionado', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generador de múltiples pacientes con eventos
          fc.array(
            fc.record({
              patientId: fc.uuid(),
              patientName: fc.string({ minLength: 3, maxLength: 50 }),
              events: fc.array(
                fc.record({
                  eventId: fc.uuid(),
                  eventType: fc.constantFrom(
                    CareEventType.MEDICATION,
                    CareEventType.FALL,
                    CareEventType.POSTURAL_CHANGE,
                    CareEventType.NUTRITION,
                    CareEventType.INCONTINENCE
                  ),
                  timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
                  performedBy: fc.string({ minLength: 3, maxLength: 30 }),
                }),
                { minLength: 1, maxLength: 10 }
              ),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (patientsData) => {
            // Limpiar almacenamiento
            mockStorage.patients = {};
            mockStorage.careEvents = {};

            // Crear pacientes y sus eventos
            for (const patientData of patientsData) {
              const patient: Patient = {
                id: patientData.patientId,
                name: patientData.patientName,
                dateOfBirth: new Date('1950-01-01'),
                riskFactors: [],
                medications: [],
                careHistory: [],
                preferences: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              await manager.createPatientProfile(patient);

              // Crear eventos para este paciente
              for (const eventData of patientData.events) {
                const event: CareEvent = {
                  id: eventData.eventId,
                  patientId: patientData.patientId,
                  eventType: eventData.eventType,
                  timestamp: eventData.timestamp,
                  performedBy: eventData.performedBy,
                  syncStatus: SyncStatus.SYNCED,
                  metadata: {},
                  createdAt: new Date(),
                };

                await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);
              }
            }

            // Para cada paciente, verificar aislamiento de datos
            for (const patientData of patientsData) {
              // Seleccionar el paciente
              await manager.selectPatient(patientData.patientId);

              // Obtener eventos filtrados
              const filteredEvents = await manager.getFilteredCareEvents();

              // Verificar que todos los eventos pertenecen al paciente seleccionado
              const allEventsMatchPatient = filteredEvents.every(
                (event) => event.patientId === patientData.patientId
              );

              expect(allEventsMatchPatient).toBe(true);

              // Verificar que no hay eventos de otros pacientes
              const hasEventsFromOtherPatients = filteredEvents.some(
                (event) => event.patientId !== patientData.patientId
              );

              expect(hasEventsFromOtherPatients).toBe(false);

              // Verificar que el número de eventos coincide
              expect(filteredEvents.length).toBe(patientData.events.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe aislar alertas por paciente', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generador de múltiples pacientes con factores de riesgo
          fc.array(
            fc.record({
              patientId: fc.uuid(),
              patientName: fc.string({ minLength: 3, maxLength: 50 }),
              riskFactors: fc.array(
                fc.record({
                  type: fc.constantFrom(
                    RiskFactorType.SEDATIVES,
                    RiskFactorType.COGNITIVE_IMPAIRMENT,
                    RiskFactorType.VISION_PROBLEMS,
                    RiskFactorType.MOBILITY_ISSUES
                  ),
                  severity: fc.constantFrom('LOW', 'MEDIUM', 'HIGH'),
                  notes: fc.string({ minLength: 5, maxLength: 100 }),
                  assessedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
                }),
                { minLength: 0, maxLength: 3 }
              ),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (patientsData) => {
            // Limpiar almacenamiento
            mockStorage.patients = {};
            mockStorage.notifications = {};

            // Crear pacientes con factores de riesgo
            for (const patientData of patientsData) {
              const patient: Patient = {
                id: patientData.patientId,
                name: patientData.patientName,
                dateOfBirth: new Date('1950-01-01'),
                riskFactors: patientData.riskFactors as RiskFactor[],
                medications: [],
                careHistory: [],
                preferences: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              await manager.createPatientProfile(patient);
            }

            // Para cada paciente, verificar que las alertas son solo suyas
            for (const patientData of patientsData) {
              const alerts = await manager.getPatientAlerts(patientData.patientId);

              // Todas las alertas deben pertenecer al paciente
              const allAlertsMatchPatient = alerts.every(
                (alert) => alert.patientId === patientData.patientId
              );

              expect(allAlertsMatchPatient).toBe(true);

              // El número de alertas debe corresponder a los factores de riesgo
              // (al menos una alerta por factor de riesgo)
              expect(alerts.length).toBeGreaterThanOrEqual(patientData.riskFactors.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('switchPatient', () => {
    it('debe cambiar correctamente entre pacientes', async () => {
      const patient1: Patient = {
        id: 'patient-1',
        name: 'Juan Pérez',
        dateOfBirth: new Date('1950-01-15'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const patient2: Patient = {
        id: 'patient-2',
        name: 'María García',
        dateOfBirth: new Date('1955-03-20'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await manager.createPatientProfile(patient1);
      await manager.createPatientProfile(patient2);

      await manager.selectPatient('patient-1');
      expect(manager.getCurrentPatientId()).toBe('patient-1');

      await manager.switchPatient('patient-2');
      expect(manager.getCurrentPatientId()).toBe('patient-2');
    });
  });

  describe('getPatientAlerts', () => {
    it('debe generar alertas basadas en factores de riesgo', async () => {
      const patient: Patient = {
        id: 'patient-1',
        name: 'Juan Pérez',
        dateOfBirth: new Date('1950-01-15'),
        riskFactors: [
          {
            type: RiskFactorType.SEDATIVES,
            severity: Severity.HIGH,
            notes: 'Toma sedantes por la noche',
            assessedAt: new Date(),
          },
          {
            type: RiskFactorType.COGNITIVE_IMPAIRMENT,
            severity: Severity.MEDIUM,
            notes: 'Deterioro cognitivo leve',
            assessedAt: new Date(),
          },
        ],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await manager.createPatientProfile(patient);
      const alerts = await manager.getPatientAlerts('patient-1');

      expect(alerts.length).toBeGreaterThanOrEqual(2);
      expect(alerts.some((a) => a.riskType === RiskFactorType.SEDATIVES)).toBe(true);
      expect(alerts.some((a) => a.riskType === RiskFactorType.COGNITIVE_IMPAIRMENT)).toBe(true);
    });
  });

  describe('Property 27: Indicadores visuales de alertas pendientes', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 27: Indicadores visuales de alertas pendientes
     * Valida: Requisitos 10.3
     * 
     * Para cualquier paciente con alertas pendientes, el sistema debe mostrar
     * un indicador visual en su perfil.
     */
    it('debe mostrar indicador cuando hay alertas pendientes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generador de pacientes con diferentes configuraciones de alertas
          fc.array(
            fc.record({
              patientId: fc.uuid(),
              patientName: fc.string({ minLength: 3, maxLength: 50 }),
              hasRiskFactors: fc.boolean(),
              riskFactors: fc.array(
                fc.record({
                  type: fc.constantFrom(
                    RiskFactorType.SEDATIVES,
                    RiskFactorType.COGNITIVE_IMPAIRMENT,
                    RiskFactorType.VISION_PROBLEMS,
                    RiskFactorType.MOBILITY_ISSUES
                  ),
                  severity: fc.constantFrom('LOW', 'MEDIUM', 'HIGH'),
                  notes: fc.string({ minLength: 5, maxLength: 100 }),
                  assessedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
                }),
                { minLength: 1, maxLength: 3 }
              ),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (patientsData) => {
            // Limpiar almacenamiento
            mockStorage.patients = {};
            mockStorage.notifications = {};

            // Crear pacientes
            for (const patientData of patientsData) {
              const patient: Patient = {
                id: patientData.patientId,
                name: patientData.patientName,
                dateOfBirth: new Date('1950-01-01'),
                riskFactors: patientData.hasRiskFactors
                  ? (patientData.riskFactors as RiskFactor[])
                  : [],
                medications: [],
                careHistory: [],
                preferences: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              await manager.createPatientProfile(patient);
            }

            // Verificar indicadores de alertas para cada paciente
            for (const patientData of patientsData) {
              const patient = await manager.getPatientById(patientData.patientId);
              
              if (!patient) continue;

              const alerts = await manager.getPatientAlerts(patientData.patientId);

              // Si el paciente tiene factores de riesgo, debe tener al menos una alerta por factor
              if (patientData.hasRiskFactors && patient.riskFactors.length > 0) {
                expect(alerts.length).toBeGreaterThanOrEqual(patient.riskFactors.length);

                // Cada alerta debe tener un ID único (indicador visual)
                const alertIds = alerts.map((a) => a.id);
                const uniqueIds = new Set(alertIds);
                expect(uniqueIds.size).toBe(alertIds.length);

                // Cada alerta debe tener un mensaje descriptivo
                alerts.forEach((alert) => {
                  expect(alert.message).toBeTruthy();
                  expect(alert.message.length).toBeGreaterThan(0);
                });

                // Cada alerta debe tener una severidad
                alerts.forEach((alert) => {
                  expect(alert.severity).toBeTruthy();
                  expect(['LOW', 'MEDIUM', 'HIGH']).toContain(alert.severity);
                });
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe proporcionar información completa para indicadores visuales', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            patientId: fc.uuid(),
            patientName: fc.string({ minLength: 3, maxLength: 50 }),
            riskFactors: fc.array(
              fc.record({
                type: fc.constantFrom(
                  RiskFactorType.SEDATIVES,
                  RiskFactorType.COGNITIVE_IMPAIRMENT,
                  RiskFactorType.VISION_PROBLEMS,
                  RiskFactorType.MOBILITY_ISSUES
                ),
                severity: fc.constantFrom('LOW', 'MEDIUM', 'HIGH'),
                notes: fc.string({ minLength: 5, maxLength: 100 }),
                assessedAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
              }),
              { minLength: 1, maxLength: 3 }
            ),
          }),
          async (patientData) => {
            // Limpiar almacenamiento
            mockStorage.patients = {};

            const patient: Patient = {
              id: patientData.patientId,
              name: patientData.patientName,
              dateOfBirth: new Date('1950-01-01'),
              riskFactors: patientData.riskFactors as RiskFactor[],
              medications: [],
              careHistory: [],
              preferences: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await manager.createPatientProfile(patient);
            const alerts = await manager.getPatientAlerts(patientData.patientId);

            // Verificar que cada alerta tiene todos los campos necesarios para un indicador visual
            alerts.forEach((alert) => {
              // ID único para el indicador
              expect(alert.id).toBeTruthy();
              expect(typeof alert.id).toBe('string');

              // ID del paciente para asociación
              expect(alert.patientId).toBe(patientData.patientId);

              // Tipo de riesgo para categorización
              expect(alert.riskType).toBeTruthy();

              // Severidad para estilo visual (color, icono)
              expect(alert.severity).toBeTruthy();
              expect(['LOW', 'MEDIUM', 'HIGH']).toContain(alert.severity);

              // Mensaje descriptivo para mostrar al usuario
              expect(alert.message).toBeTruthy();
              expect(alert.message.length).toBeGreaterThan(10);

              // Timestamp para ordenamiento
              expect(alert.createdAt).toBeInstanceOf(Date);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Integration Tests: Multiple Patients Workflow', () => {
    /**
     * Pruebas de integración para flujo completo de múltiples pacientes
     * Valida: Requisitos 10.1, 10.2, 10.5
     * 
     * Flujo: Crear 3 pacientes → registrar eventos → cambiar entre pacientes → verificar aislamiento
     */
    it('debe gestionar correctamente el flujo completo de múltiples pacientes', async () => {
      // Limpiar almacenamiento
      mockStorage.patients = {};
      mockStorage.careEvents = {};

      // Paso 1: Crear 3 pacientes
      const patient1: Patient = {
        id: 'patient-1',
        name: 'Juan Pérez',
        dateOfBirth: new Date('1950-01-15'),
        riskFactors: [
          {
            type: RiskFactorType.SEDATIVES,
            severity: Severity.HIGH,
            notes: 'Toma sedantes',
            assessedAt: new Date(),
          },
        ],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const patient2: Patient = {
        id: 'patient-2',
        name: 'María García',
        dateOfBirth: new Date('1955-03-20'),
        riskFactors: [
          {
            type: RiskFactorType.COGNITIVE_IMPAIRMENT,
            severity: Severity.MEDIUM,
            notes: 'Deterioro cognitivo leve',
            assessedAt: new Date(),
          },
        ],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const patient3: Patient = {
        id: 'patient-3',
        name: 'Carlos López',
        dateOfBirth: new Date('1948-07-10'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result1 = await manager.createPatientProfile(patient1);
      const result2 = await manager.createPatientProfile(patient2);
      const result3 = await manager.createPatientProfile(patient3);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(result3.ok).toBe(true);

      // Paso 2: Registrar eventos para cada paciente
      const event1: CareEvent = {
        id: 'event-1',
        patientId: 'patient-1',
        eventType: CareEventType.MEDICATION,
        timestamp: new Date(),
        performedBy: 'Cuidador A',
        syncStatus: SyncStatus.SYNCED,
        metadata: { medication: 'Aspirina' },
        createdAt: new Date(),
      };

      const event2: CareEvent = {
        id: 'event-2',
        patientId: 'patient-1',
        eventType: CareEventType.POSTURAL_CHANGE,
        timestamp: new Date(),
        performedBy: 'Cuidador A',
        syncStatus: SyncStatus.SYNCED,
        metadata: { position: 'LEFT_LATERAL' },
        createdAt: new Date(),
      };

      const event3: CareEvent = {
        id: 'event-3',
        patientId: 'patient-2',
        eventType: CareEventType.NUTRITION,
        timestamp: new Date(),
        performedBy: 'Cuidador B',
        syncStatus: SyncStatus.SYNCED,
        metadata: { meal: 'Desayuno' },
        createdAt: new Date(),
      };

      const event4: CareEvent = {
        id: 'event-4',
        patientId: 'patient-3',
        eventType: CareEventType.FALL,
        timestamp: new Date(),
        performedBy: 'Cuidador C',
        syncStatus: SyncStatus.SYNCED,
        metadata: { timeOnFloor: 5 },
        createdAt: new Date(),
      };

      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event1);
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event2);
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event3);
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event4);

      // Paso 3: Cambiar entre pacientes y verificar aislamiento
      
      // Seleccionar paciente 1
      await manager.selectPatient('patient-1');
      expect(manager.getCurrentPatientId()).toBe('patient-1');
      
      let events = await manager.getFilteredCareEvents();
      expect(events.length).toBe(2);
      expect(events.every((e) => e.patientId === 'patient-1')).toBe(true);
      
      let alerts = await manager.getPatientAlerts('patient-1');
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every((a) => a.patientId === 'patient-1')).toBe(true);

      // Cambiar a paciente 2
      await manager.switchPatient('patient-2');
      expect(manager.getCurrentPatientId()).toBe('patient-2');
      
      events = await manager.getFilteredCareEvents();
      expect(events.length).toBe(1);
      expect(events.every((e) => e.patientId === 'patient-2')).toBe(true);
      
      alerts = await manager.getPatientAlerts('patient-2');
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every((a) => a.patientId === 'patient-2')).toBe(true);

      // Cambiar a paciente 3
      await manager.switchPatient('patient-3');
      expect(manager.getCurrentPatientId()).toBe('patient-3');
      
      events = await manager.getFilteredCareEvents();
      expect(events.length).toBe(1);
      expect(events.every((e) => e.patientId === 'patient-3')).toBe(true);
      
      alerts = await manager.getPatientAlerts('patient-3');
      // Paciente 3 no tiene factores de riesgo, puede tener 0 alertas
      expect(alerts.every((a) => a.patientId === 'patient-3')).toBe(true);

      // Paso 4: Verificar que todos los pacientes están disponibles
      const allPatients = await manager.getAllPatients();
      expect(allPatients.length).toBe(3);
      expect(allPatients.some((p) => p.id === 'patient-1')).toBe(true);
      expect(allPatients.some((p) => p.id === 'patient-2')).toBe(true);
      expect(allPatients.some((p) => p.id === 'patient-3')).toBe(true);
    });

    it('debe mantener aislamiento de datos al cambiar rápidamente entre pacientes', async () => {
      // Limpiar almacenamiento
      mockStorage.patients = {};
      mockStorage.careEvents = {};

      // Crear 2 pacientes
      const patient1: Patient = {
        id: 'patient-a',
        name: 'Paciente A',
        dateOfBirth: new Date('1950-01-01'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const patient2: Patient = {
        id: 'patient-b',
        name: 'Paciente B',
        dateOfBirth: new Date('1955-01-01'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await manager.createPatientProfile(patient1);
      await manager.createPatientProfile(patient2);

      // Crear eventos para cada paciente
      for (let i = 0; i < 5; i++) {
        const eventA: CareEvent = {
          id: `event-a-${i}`,
          patientId: 'patient-a',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date(),
          performedBy: 'Cuidador',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date(),
        };

        const eventB: CareEvent = {
          id: `event-b-${i}`,
          patientId: 'patient-b',
          eventType: CareEventType.NUTRITION,
          timestamp: new Date(),
          performedBy: 'Cuidador',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date(),
        };

        await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, eventA);
        await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, eventB);
      }

      // Cambiar rápidamente entre pacientes múltiples veces
      for (let i = 0; i < 10; i++) {
        const patientId = i % 2 === 0 ? 'patient-a' : 'patient-b';
        await manager.switchPatient(patientId);
        
        const events = await manager.getFilteredCareEvents();
        
        // Verificar que todos los eventos pertenecen al paciente actual
        expect(events.every((e) => e.patientId === patientId)).toBe(true);
        expect(events.length).toBe(5);
      }
    });

    it('debe actualizar correctamente los perfiles de pacientes', async () => {
      // Limpiar almacenamiento
      mockStorage.patients = {};

      // Crear paciente
      const patient: Patient = {
        id: 'patient-update',
        name: 'Paciente Original',
        dateOfBirth: new Date('1950-01-01'),
        riskFactors: [],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await manager.createPatientProfile(patient);

      // Actualizar paciente
      patient.name = 'Paciente Actualizado';
      patient.riskFactors = [
        {
          type: RiskFactorType.SEDATIVES,
          severity: Severity.HIGH,
          notes: 'Nuevo factor de riesgo',
          assessedAt: new Date(),
        },
      ];

      const updateResult = await manager.updatePatientProfile(patient);
      expect(updateResult.ok).toBe(true);

      // Verificar actualización
      const updatedPatient = await manager.getPatientById('patient-update');
      expect(updatedPatient).toBeTruthy();
      expect(updatedPatient!.name).toBe('Paciente Actualizado');
      expect(updatedPatient!.riskFactors.length).toBe(1);
    });
  });
});
