/**
 * Pruebas para FallPreventionManager
 * Incluye pruebas basadas en propiedades y pruebas unitarias
 */

import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  FallPreventionManager,
  getFallPreventionManager,
  resetFallPreventionManager,
} from './FallPreventionManager';
import { ErrorCode, RiskFactorType, Severity, RiskChecklistStatus } from '../types/enums';
import type { FallIncident, RiskChecklist, Patient } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

describe('FallPreventionManager', () => {
  let fallPreventionManager: FallPreventionManager;

  beforeEach(async () => {
    resetFallPreventionManager();
    fallPreventionManager = getFallPreventionManager();
    
    // Limpiar stores relevantes
    try {
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.FALL_INCIDENTS);
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.RISK_CHECKLISTS);
      await IndexedDBUtils.clear(IndexedDBUtils.STORES.RISK_ALERTS);
    } catch (error) {
      // Ignorar errores si los stores no existen aún
    }
  });

  afterEach(() => {
    resetFallPreventionManager();
  });

  describe('Property-Based Tests', () => {
    describe('Propiedad 5: Campo obligatorio de tiempo en el suelo', () => {
      it('debe rechazar registros de caída sin campo "tiempo en el suelo"', async () => {
        // Feature: cuido-a-mi-tata, Property 5: Campo obligatorio de tiempo en el suelo
        // Valida: Requisitos 2.3
        
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // id no vacío
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // patientId no vacío
            fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), // occurredAt
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // location no vacío
            fc.string(), // circumstances
            fc.array(fc.string()), // injuries
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // reportedBy no vacío
            fc.option(fc.oneof(
              fc.constant(null),
              fc.constant(undefined),
              fc.constant(NaN),
              fc.constant(''),
              fc.constant([])
            ), { nil: undefined }), // timeOnFloor inválido
            async (id, patientId, occurredAt, location, circumstances, injuries, reportedBy, invalidTimeOnFloor) => {
              const incident: FallIncident = {
                id,
                patientId,
                occurredAt,
                timeOnFloor: invalidTimeOnFloor as any,
                location,
                circumstances,
                injuries,
                reportedBy,
                createdAt: new Date(),
              };

              const result = await fallPreventionManager.recordFallIncident(incident);

              // Debe rechazar el registro
              // NaN se rechaza con VALIDATION_INVALID_FORMAT, otros con VALIDATION_REQUIRED_FIELD
              if (!result.ok) {
                const isNaNValue = typeof invalidTimeOnFloor === 'number' && isNaN(invalidTimeOnFloor);
                if (isNaNValue) {
                  return result.error.code === ErrorCode.VALIDATION_INVALID_FORMAT &&
                         result.error.message.includes('número válido');
                } else {
                  return result.error.code === ErrorCode.VALIDATION_REQUIRED_FIELD &&
                         result.error.message.includes('tiempo en el suelo');
                }
              }
              return false;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe aceptar registros de caída con campo "tiempo en el suelo" válido', async () => {
        // Feature: cuido-a-mi-tata, Property 5: Campo obligatorio de tiempo en el suelo
        // Valida: Requisitos 2.3
        
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // id no vacío
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // patientId no vacío
            fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), // occurredAt
            fc.integer({ min: 0, max: 1440 }), // timeOnFloor (0-1440 minutos = 0-24 horas)
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // location no vacío
            fc.string(), // circumstances
            fc.array(fc.string()), // injuries
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // reportedBy no vacío
            async (id, patientId, occurredAt, timeOnFloor, location, circumstances, injuries, reportedBy) => {
              const incident: FallIncident = {
                id,
                patientId,
                occurredAt,
                timeOnFloor,
                location,
                circumstances,
                injuries,
                reportedBy,
                createdAt: new Date(),
              };

              const result = await fallPreventionManager.recordFallIncident(incident);

              // Debe aceptar el registro
              return result.ok === true;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe rechazar valores negativos de tiempo en el suelo', async () => {
        // Probar específicamente valores negativos
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // id no vacío
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // patientId no vacío
            fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), // occurredAt
            fc.integer({ min: -1000, max: -1 }), // timeOnFloor negativo
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // location no vacío
            fc.string(), // circumstances
            fc.array(fc.string()), // injuries
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // reportedBy no vacío
            async (id, patientId, occurredAt, timeOnFloor, location, circumstances, injuries, reportedBy) => {
              const incident: FallIncident = {
                id,
                patientId,
                occurredAt,
                timeOnFloor,
                location,
                circumstances,
                injuries,
                reportedBy,
                createdAt: new Date(),
              };

              const result = await fallPreventionManager.recordFallIncident(incident);

              // Debe rechazar valores negativos
              return !result.ok &&
                     result.error.code === ErrorCode.VALIDATION_INVALID_FORMAT &&
                     result.error.message.includes('mayor o igual a cero');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe aceptar tiempo en el suelo de cero minutos', async () => {
        // Caso especial: caída sin tiempo en el suelo (levantado inmediatamente)
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // id no vacío
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // patientId no vacío
            fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), // occurredAt
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // location no vacío
            fc.string(), // circumstances
            fc.array(fc.string()), // injuries
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // reportedBy no vacío
            async (id, patientId, occurredAt, location, circumstances, injuries, reportedBy) => {
              const incident: FallIncident = {
                id,
                patientId,
                occurredAt,
                timeOnFloor: 0, // Cero minutos es válido
                location,
                circumstances,
                injuries,
                reportedBy,
                createdAt: new Date(),
              };

              const result = await fallPreventionManager.recordFallIncident(incident);

              // Debe aceptar cero minutos
              return result.ok === true;
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Propiedad 6: Alertas automáticas por factores de riesgo', () => {
      it('debe generar alertas para pacientes con sedantes prescritos', async () => {
        // Feature: cuido-a-mi-tata, Property 6: Alertas automáticas por factores de riesgo
        // Valida: Requisitos 2.4
        
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // id no vacío
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // name no vacío
            fc.date({ min: new Date('1920-01-01'), max: new Date('2010-12-31') }), // dateOfBirth
            fc.constantFrom(Severity.LOW, Severity.MEDIUM, Severity.HIGH), // severity
            fc.string(), // notes
            async (id, name, dateOfBirth, severity, notes) => {
              const patient: Patient = {
                id,
                name,
                dateOfBirth,
                riskFactors: [
                  {
                    type: RiskFactorType.SEDATIVES,
                    severity,
                    notes,
                    assessedAt: new Date(),
                  },
                ],
                medications: [],
                careHistory: [],
                preferences: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              const alerts = await fallPreventionManager.getRiskAlerts(patient);

              // Debe generar al menos una alerta para sedantes
              return alerts.length > 0 &&
                     alerts.some(alert => 
                       alert.riskType === RiskFactorType.SEDATIVES &&
                       alert.message.includes('sedantes')
                     );
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe generar alertas para pacientes con deterioro cognitivo', async () => {
        // Feature: cuido-a-mi-tata, Property 6: Alertas automáticas por factores de riesgo
        // Valida: Requisitos 2.5
        
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // id no vacío
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // name no vacío
            fc.date({ min: new Date('1920-01-01'), max: new Date('2010-12-31') }), // dateOfBirth
            fc.constantFrom(Severity.LOW, Severity.MEDIUM, Severity.HIGH), // severity
            fc.string(), // notes
            async (id, name, dateOfBirth, severity, notes) => {
              const patient: Patient = {
                id,
                name,
                dateOfBirth,
                riskFactors: [
                  {
                    type: RiskFactorType.COGNITIVE_IMPAIRMENT,
                    severity,
                    notes,
                    assessedAt: new Date(),
                  },
                ],
                medications: [],
                careHistory: [],
                preferences: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              const alerts = await fallPreventionManager.getRiskAlerts(patient);

              // Debe generar al menos una alerta para deterioro cognitivo
              return alerts.length > 0 &&
                     alerts.some(alert => 
                       alert.riskType === RiskFactorType.COGNITIVE_IMPAIRMENT &&
                       alert.message.includes('cognitivo')
                     );
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe generar alertas para pacientes con problemas de visión', async () => {
        // Feature: cuido-a-mi-tata, Property 6: Alertas automáticas por factores de riesgo
        // Valida: Requisitos 2.6
        
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // id no vacío
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // name no vacío
            fc.date({ min: new Date('1920-01-01'), max: new Date('2010-12-31') }), // dateOfBirth
            fc.constantFrom(Severity.LOW, Severity.MEDIUM, Severity.HIGH), // severity
            fc.string(), // notes
            async (id, name, dateOfBirth, severity, notes) => {
              const patient: Patient = {
                id,
                name,
                dateOfBirth,
                riskFactors: [
                  {
                    type: RiskFactorType.VISION_PROBLEMS,
                    severity,
                    notes,
                    assessedAt: new Date(),
                  },
                ],
                medications: [],
                careHistory: [],
                preferences: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              const alerts = await fallPreventionManager.getRiskAlerts(patient);

              // Debe generar al menos una alerta para problemas de visión
              return alerts.length > 0 &&
                     alerts.some(alert => 
                       alert.riskType === RiskFactorType.VISION_PROBLEMS &&
                       alert.message.includes('visión')
                     );
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe generar múltiples alertas para pacientes con múltiples factores de riesgo', async () => {
        // Feature: cuido-a-mi-tata, Property 6: Alertas automáticas por factores de riesgo
        // Valida: Requisitos 2.4, 2.5, 2.6
        
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // id no vacío
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // name no vacío
            fc.date({ min: new Date('1920-01-01'), max: new Date('2010-12-31') }), // dateOfBirth
            fc.array(
              fc.record({
                type: fc.constantFrom(
                  RiskFactorType.SEDATIVES,
                  RiskFactorType.COGNITIVE_IMPAIRMENT,
                  RiskFactorType.VISION_PROBLEMS,
                  RiskFactorType.MOBILITY_ISSUES
                ),
                severity: fc.constantFrom(Severity.LOW, Severity.MEDIUM, Severity.HIGH),
                notes: fc.string(),
                assessedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              }),
              { minLength: 1, maxLength: 4 }
            ),
            async (id, name, dateOfBirth, riskFactors) => {
              const patient: Patient = {
                id,
                name,
                dateOfBirth,
                riskFactors,
                medications: [],
                careHistory: [],
                preferences: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              const alerts = await fallPreventionManager.getRiskAlerts(patient);

              // Debe generar una alerta por cada factor de riesgo
              return alerts.length === riskFactors.length &&
                     riskFactors.every(rf => 
                       alerts.some(alert => alert.riskType === rf.type)
                     );
            }
          ),
          { numRuns: 100 }
        );
      });

      it('no debe generar alertas para pacientes sin factores de riesgo', async () => {
        // Feature: cuido-a-mi-tata, Property 6: Alertas automáticas por factores de riesgo
        // Valida: Requisitos 2.4, 2.5, 2.6
        
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // id no vacío
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // name no vacío
            fc.date({ min: new Date('1920-01-01'), max: new Date('2010-12-31') }), // dateOfBirth
            async (id, name, dateOfBirth) => {
              const patient: Patient = {
                id,
                name,
                dateOfBirth,
                riskFactors: [], // Sin factores de riesgo
                medications: [],
                careHistory: [],
                preferences: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              const alerts = await fallPreventionManager.getRiskAlerts(patient);

              // No debe generar alertas
              return alerts.length === 0;
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('Unit Tests - Edge Cases', () => {
    describe('submitDailyChecklist - campos requeridos', () => {
      it('debe aceptar lista de verificación completa con todos los campos', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-001',
          patientId: 'patient-001',
          checkDate: new Date('2024-01-15'),
          lighting: RiskChecklistStatus.ADEQUATE,
          flooring: RiskChecklistStatus.SAFE,
          footwear: RiskChecklistStatus.APPROPRIATE,
          notes: 'Todo en orden',
          completedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(true);
      });

      it('debe rechazar lista sin campo de iluminación', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-002',
          patientId: 'patient-001',
          checkDate: new Date('2024-01-15'),
          lighting: undefined as any,
          flooring: RiskChecklistStatus.SAFE,
          footwear: RiskChecklistStatus.APPROPRIATE,
          notes: '',
          completedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
          expect(result.error.message).toContain('iluminación');
        }
      });

      it('debe rechazar lista sin campo de suelos', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-003',
          patientId: 'patient-001',
          checkDate: new Date('2024-01-15'),
          lighting: RiskChecklistStatus.ADEQUATE,
          flooring: undefined as any,
          footwear: RiskChecklistStatus.APPROPRIATE,
          notes: '',
          completedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
          expect(result.error.message).toContain('suelos');
        }
      });

      it('debe rechazar lista sin campo de calzado', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-004',
          patientId: 'patient-001',
          checkDate: new Date('2024-01-15'),
          lighting: RiskChecklistStatus.ADEQUATE,
          flooring: RiskChecklistStatus.SAFE,
          footwear: undefined as any,
          notes: '',
          completedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
          expect(result.error.message).toContain('calzado');
        }
      });

      it('debe aceptar lista con iluminación inadecuada', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-005',
          patientId: 'patient-001',
          checkDate: new Date('2024-01-15'),
          lighting: RiskChecklistStatus.INADEQUATE,
          flooring: RiskChecklistStatus.SAFE,
          footwear: RiskChecklistStatus.APPROPRIATE,
          notes: 'Iluminación insuficiente en pasillo',
          completedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(true);
      });

      it('debe aceptar lista con suelos peligrosos', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-006',
          patientId: 'patient-001',
          checkDate: new Date('2024-01-15'),
          lighting: RiskChecklistStatus.ADEQUATE,
          flooring: RiskChecklistStatus.HAZARDOUS,
          footwear: RiskChecklistStatus.APPROPRIATE,
          notes: 'Alfombra suelta en sala',
          completedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(true);
      });

      it('debe aceptar lista con calzado inapropiado', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-007',
          patientId: 'patient-001',
          checkDate: new Date('2024-01-15'),
          lighting: RiskChecklistStatus.ADEQUATE,
          flooring: RiskChecklistStatus.SAFE,
          footwear: RiskChecklistStatus.INAPPROPRIATE,
          notes: 'Paciente usa pantuflas resbaladizas',
          completedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(true);
      });

      it('debe aceptar lista con múltiples problemas identificados', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-008',
          patientId: 'patient-001',
          checkDate: new Date('2024-01-15'),
          lighting: RiskChecklistStatus.INADEQUATE,
          flooring: RiskChecklistStatus.HAZARDOUS,
          footwear: RiskChecklistStatus.INAPPROPRIATE,
          notes: 'Múltiples riesgos detectados - requiere intervención inmediata',
          completedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(true);
      });

      it('debe rechazar lista sin fecha de verificación', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-009',
          patientId: 'patient-001',
          checkDate: undefined as any,
          lighting: RiskChecklistStatus.ADEQUATE,
          flooring: RiskChecklistStatus.SAFE,
          footwear: RiskChecklistStatus.APPROPRIATE,
          notes: '',
          completedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
          expect(result.error.message).toContain('fecha');
        }
      });

      it('debe rechazar lista sin completedBy', async () => {
        const checklist: RiskChecklist = {
          id: 'checklist-010',
          patientId: 'patient-001',
          checkDate: new Date('2024-01-15'),
          lighting: RiskChecklistStatus.ADEQUATE,
          flooring: RiskChecklistStatus.SAFE,
          footwear: RiskChecklistStatus.APPROPRIATE,
          notes: '',
          completedBy: undefined as any,
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.submitDailyChecklist(checklist);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
          expect(result.error.message).toContain('completedBy');
        }
      });
    });

    describe('recordFallIncident - campo obligatorio tiempo en el suelo', () => {
      it('debe rechazar incidente sin timeOnFloor (undefined)', async () => {
        const incident: FallIncident = {
          id: 'fall-001',
          patientId: 'patient-001',
          occurredAt: new Date('2024-01-15T14:30:00'),
          timeOnFloor: undefined as any,
          location: 'Baño',
          circumstances: 'Resbaló en el suelo mojado',
          injuries: ['Contusión en cadera'],
          reportedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.recordFallIncident(incident);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
          expect(result.error.message).toContain('tiempo en el suelo');
        }
      });

      it('debe rechazar incidente sin timeOnFloor (null)', async () => {
        const incident: FallIncident = {
          id: 'fall-002',
          patientId: 'patient-001',
          occurredAt: new Date('2024-01-15T14:30:00'),
          timeOnFloor: null as any,
          location: 'Dormitorio',
          circumstances: 'Tropezó con alfombra',
          injuries: [],
          reportedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.recordFallIncident(incident);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
          expect(result.error.message).toContain('tiempo en el suelo');
        }
      });

      it('debe rechazar incidente con timeOnFloor negativo', async () => {
        const incident: FallIncident = {
          id: 'fall-003',
          patientId: 'patient-001',
          occurredAt: new Date('2024-01-15T14:30:00'),
          timeOnFloor: -5,
          location: 'Cocina',
          circumstances: 'Perdió el equilibrio',
          injuries: [],
          reportedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.recordFallIncident(incident);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
          expect(result.error.message).toContain('mayor o igual a cero');
        }
      });

      it('debe aceptar incidente con timeOnFloor de 0 minutos', async () => {
        const incident: FallIncident = {
          id: 'fall-004',
          patientId: 'patient-001',
          occurredAt: new Date('2024-01-15T14:30:00'),
          timeOnFloor: 0,
          location: 'Sala',
          circumstances: 'Se levantó inmediatamente',
          injuries: [],
          reportedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.recordFallIncident(incident);

        expect(result.ok).toBe(true);
      });

      it('debe aceptar incidente con timeOnFloor válido (5 minutos)', async () => {
        const incident: FallIncident = {
          id: 'fall-005',
          patientId: 'patient-001',
          occurredAt: new Date('2024-01-15T14:30:00'),
          timeOnFloor: 5,
          location: 'Pasillo',
          circumstances: 'No pudo levantarse solo',
          injuries: ['Dolor en rodilla'],
          reportedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.recordFallIncident(incident);

        expect(result.ok).toBe(true);
      });

      it('debe aceptar incidente con timeOnFloor largo (30 minutos)', async () => {
        const incident: FallIncident = {
          id: 'fall-006',
          patientId: 'patient-001',
          occurredAt: new Date('2024-01-15T14:30:00'),
          timeOnFloor: 30,
          location: 'Dormitorio',
          circumstances: 'Caída durante la noche, encontrado por la mañana',
          injuries: ['Hipotermia leve', 'Contusión'],
          reportedBy: 'Cuidador Principal',
          createdAt: new Date(),
        };

        const result = await fallPreventionManager.recordFallIncident(incident);

        expect(result.ok).toBe(true);
      });
    });
  });
});
