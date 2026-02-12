/**
 * Ethical Care Module Tests
 * Pruebas unitarias y de propiedades para el módulo de cuidado ético
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  EthicalCareModule,
  getEthicalCareModule,
  resetEthicalCareModule,
} from './EthicalCareModule';
import { RestraintType, RestraintStatus, ErrorCode } from '../types/enums';
import type { Restraint } from '../types/models';

describe('EthicalCareModule', () => {
  let module: EthicalCareModule;

  beforeEach(() => {
    resetEthicalCareModule();
    module = getEthicalCareModule();
  });

  describe('Property 17: Bloqueo de restricciones químicas', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 17: Bloqueo de restricciones químicas
     * Valida: Requisitos 7.1
     * 
     * Para cualquier intento de registrar sedantes con propósito de manejo conductual,
     * el sistema debe bloquear la acción y mostrar advertencia de restricción química.
     */
    it('debe bloquear restricciones químicas para manejo conductual', () => {
      fc.assert(
        fc.property(
          // Generador de restricciones químicas con justificaciones de comportamiento
          fc.record({
            id: fc.uuid(),
            patientId: fc.uuid(),
            type: fc.constant(RestraintType.CHEMICAL),
            specificType: fc.oneof(
              fc.constant('Sedante'),
              fc.constant('Tranquilizante'),
              fc.constant('Benzodiacepina'),
              fc.constant('Antipsicótico')
            ),
            justification: fc.oneof(
              fc.constant('Paciente agitado'),
              fc.constant('Comportamiento agresivo'),
              fc.constant('Deambulación excesiva'),
              fc.constant('Paciente inquieto y confuso'),
              fc.constant('No coopera con el cuidado'),
              fc.constant('Agitación nocturna'),
              fc.constant('Conducta disruptiva')
            ),
            alternatives: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
            authorizedBy: fc.string({ minLength: 3 }),
            startTime: fc.date(),
            reviewSchedule: fc.array(fc.date(), { minLength: 1 }),
            status: fc.constant(RestraintStatus.ACTIVE),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (restraint) => {
            const result = module.validateRestraint(restraint);

            // Debe ser inválido
            expect(result.isValid).toBe(false);

            // Debe tener el código de error correcto
            expect(result.errorCode).toBe(ErrorCode.BUSINESS_CHEMICAL_RESTRAINT_BLOCKED);

            // Debe tener un mensaje de advertencia
            expect(result.message).toBeDefined();
            expect(result.message).toContain('sedantes');
            expect(result.message).toContain('manejo conductual');
            expect(result.message).toContain('alternativas');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe permitir restricciones químicas para indicaciones médicas válidas', () => {
      fc.assert(
        fc.property(
          // Generador de restricciones químicas con justificaciones médicas
          fc.record({
            id: fc.uuid(),
            patientId: fc.uuid(),
            type: fc.constant(RestraintType.CHEMICAL),
            specificType: fc.oneof(
              fc.constant('Sedante'),
              fc.constant('Benzodiacepina'),
              fc.constant('Antipsicótico')
            ),
            justification: fc.oneof(
              fc.constant('Trastorno de ansiedad clínica diagnosticado'),
              fc.constant('Insomnio crónico con prescripción médica'),
              fc.constant('Convulsiones - tratamiento antiepiléptico'),
              fc.constant('Procedimiento médico - anestesia'),
              fc.constant('Dolor severo post-operatorio'),
              fc.constant('Abstinencia alcohólica - delirium tremens')
            ),
            alternatives: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
            authorizedBy: fc.string({ minLength: 3 }),
            startTime: fc.date(),
            reviewSchedule: fc.array(fc.date(), { minLength: 1 }),
            status: fc.constant(RestraintStatus.ACTIVE),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (restraint) => {
            const result = module.validateRestraint(restraint);

            // Debe ser válido para indicaciones médicas
            expect(result.isValid).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 18: Clasificación automática de restricciones mecánicas', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 18: Clasificación automática de restricciones mecánicas
     * Valida: Requisitos 7.2
     * 
     * Para cualquier registro de barandillas laterales, el sistema debe clasificarlas
     * automáticamente como restricción mecánica.
     */
    it('debe clasificar barandillas laterales como restricción mecánica', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            patientId: fc.uuid(),
            type: fc.constant(undefined as any), // Sin tipo asignado
            specificType: fc.oneof(
              fc.constant('Barandillas laterales'),
              fc.constant('Barandilla de cama'),
              fc.constant('Barandillas completas'),
              fc.constant('Barandilla izquierda'),
              fc.constant('Barandilla derecha')
            ),
            justification: fc.string({ minLength: 10 }),
            alternatives: fc.array(fc.string(), { minLength: 1 }),
            authorizedBy: fc.string({ minLength: 3 }),
            startTime: fc.date(),
            reviewSchedule: fc.array(fc.date(), { minLength: 1 }),
            status: fc.constant(RestraintStatus.ACTIVE),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (restraint) => {
            const classified = module.classifyRestraint(restraint);

            // Debe clasificarse como MECHANICAL
            expect(classified).toBe(RestraintType.MECHANICAL);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe clasificar correctamente restricciones químicas', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            patientId: fc.uuid(),
            type: fc.constant(undefined as any),
            specificType: fc.oneof(
              fc.constant('Sedante lorazepam'),
              fc.constant('Tranquilizante'),
              fc.constant('Antipsicótico haloperidol'),
              fc.constant('Benzodiacepina diazepam')
            ),
            justification: fc.string({ minLength: 10 }),
            alternatives: fc.array(fc.string(), { minLength: 1 }),
            authorizedBy: fc.string({ minLength: 3 }),
            startTime: fc.date(),
            reviewSchedule: fc.array(fc.date(), { minLength: 1 }),
            status: fc.constant(RestraintStatus.ACTIVE),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (restraint) => {
            const classified = module.classifyRestraint(restraint);

            // Debe clasificarse como CHEMICAL
            expect(classified).toBe(RestraintType.CHEMICAL);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe clasificar correctamente restricciones ambientales', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            patientId: fc.uuid(),
            type: fc.constant(undefined as any),
            specificType: fc.oneof(
              fc.constant('Puerta cerrada con llave'),
              fc.constant('Alarma de salida'),
              fc.constant('Sensor de movimiento'),
              fc.constant('Cerradura de seguridad')
            ),
            justification: fc.string({ minLength: 10 }),
            alternatives: fc.array(fc.string(), { minLength: 1 }),
            authorizedBy: fc.string({ minLength: 3 }),
            startTime: fc.date(),
            reviewSchedule: fc.array(fc.date(), { minLength: 1 }),
            status: fc.constant(RestraintStatus.ACTIVE),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (restraint) => {
            const classified = module.classifyRestraint(restraint);

            // Debe clasificarse como ENVIRONMENTAL
            expect(classified).toBe(RestraintType.ENVIRONMENTAL);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe mantener el tipo si ya está asignado', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            patientId: fc.uuid(),
            type: fc.constantFrom(
              RestraintType.CHEMICAL,
              RestraintType.MECHANICAL,
              RestraintType.ENVIRONMENTAL
            ),
            specificType: fc.string({ minLength: 5 }),
            justification: fc.string({ minLength: 10 }),
            alternatives: fc.array(fc.string(), { minLength: 1 }),
            authorizedBy: fc.string({ minLength: 3 }),
            startTime: fc.date(),
            reviewSchedule: fc.array(fc.date(), { minLength: 1 }),
            status: fc.constant(RestraintStatus.ACTIVE),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          (restraint) => {
            const originalType = restraint.type;
            const classified = module.classifyRestraint(restraint);

            // Debe mantener el tipo original
            expect(classified).toBe(originalType);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 19: Panel de estrategias alternativas', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 19: Panel de estrategias alternativas
     * Valida: Requisitos 7.3
     * 
     * Para cualquier restricción identificada, el sistema debe mostrar un panel
     * con estrategias alternativas antes de permitir el registro.
     */
    it('debe proporcionar estrategias alternativas para cualquier contexto', () => {
      fc.assert(
        fc.property(
          fc.record({
            patientId: fc.uuid(),
            situation: fc.string({ minLength: 10 }),
            currentRestraints: fc.array(
              fc.record({
                id: fc.uuid(),
                patientId: fc.uuid(),
                type: fc.constantFrom(
                  RestraintType.CHEMICAL,
                  RestraintType.MECHANICAL,
                  RestraintType.ENVIRONMENTAL
                ),
                specificType: fc.string({ minLength: 5 }),
                justification: fc.string({ minLength: 10 }),
                alternatives: fc.array(fc.string(), { minLength: 1 }),
                authorizedBy: fc.string({ minLength: 3 }),
                startTime: fc.date(),
                reviewSchedule: fc.array(fc.date(), { minLength: 1 }),
                status: fc.constant(RestraintStatus.ACTIVE),
                createdAt: fc.date(),
                updatedAt: fc.date(),
              }),
              { maxLength: 3 }
            ),
            riskFactors: fc.array(
              fc.record({
                type: fc.constantFrom(
                  'SEDATIVES' as const,
                  'COGNITIVE_IMPAIRMENT' as const,
                  'VISION_PROBLEMS' as const,
                  'MOBILITY_ISSUES' as const
                ),
                severity: fc.constantFrom('LOW' as const, 'MEDIUM' as const, 'HIGH' as const),
                notes: fc.string(),
                assessedAt: fc.date(),
              }),
              { maxLength: 3 }
            ),
          }),
          (context) => {
            const strategies = module.getAlternativeStrategies(context);

            // Debe devolver un array de estrategias
            expect(Array.isArray(strategies)).toBe(true);
            expect(strategies.length).toBeGreaterThan(0);

            // Cada estrategia debe tener los campos requeridos
            strategies.forEach((strategy) => {
              expect(strategy.id).toBeDefined();
              expect(strategy.category).toBeDefined();
              expect(['DISTRACTION', 'COMMUNICATION', 'ENVIRONMENTAL']).toContain(
                strategy.category
              );
              expect(strategy.title).toBeDefined();
              expect(strategy.description).toBeDefined();
              expect(Array.isArray(strategy.examples)).toBe(true);
              expect(strategy.examples.length).toBeGreaterThan(0);
            });

            // Debe incluir estrategias de las tres categorías
            const categories = strategies.map((s) => s.category);
            expect(categories).toContain('DISTRACTION');
            expect(categories).toContain('COMMUNICATION');
            expect(categories).toContain('ENVIRONMENTAL');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe proporcionar ejemplos concretos en cada estrategia', () => {
      fc.assert(
        fc.property(
          fc.record({
            patientId: fc.uuid(),
            situation: fc.string({ minLength: 10 }),
            currentRestraints: fc.array(
              fc.record({
                id: fc.uuid(),
                patientId: fc.uuid(),
                type: fc.constantFrom(
                  RestraintType.CHEMICAL,
                  RestraintType.MECHANICAL,
                  RestraintType.ENVIRONMENTAL
                ),
                specificType: fc.string({ minLength: 5 }),
                justification: fc.string({ minLength: 10 }),
                alternatives: fc.array(fc.string(), { minLength: 1 }),
                authorizedBy: fc.string({ minLength: 3 }),
                startTime: fc.date(),
                reviewSchedule: fc.array(fc.date(), { minLength: 1 }),
                status: fc.constant(RestraintStatus.ACTIVE),
                createdAt: fc.date(),
                updatedAt: fc.date(),
              }),
              { maxLength: 2 }
            ),
            riskFactors: fc.array(
              fc.record({
                type: fc.constantFrom(
                  'SEDATIVES' as const,
                  'COGNITIVE_IMPAIRMENT' as const,
                  'VISION_PROBLEMS' as const,
                  'MOBILITY_ISSUES' as const
                ),
                severity: fc.constantFrom('LOW' as const, 'MEDIUM' as const, 'HIGH' as const),
                notes: fc.string(),
                assessedAt: fc.date(),
              }),
              { maxLength: 2 }
            ),
          }),
          (context) => {
            const strategies = module.getAlternativeStrategies(context);

            // Cada estrategia debe tener al menos 3 ejemplos concretos
            strategies.forEach((strategy) => {
              expect(strategy.examples.length).toBeGreaterThanOrEqual(3);

              // Los ejemplos deben ser strings no vacíos
              strategy.examples.forEach((example) => {
                expect(typeof example).toBe('string');
                expect(example.length).toBeGreaterThan(0);
              });
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests: Bloqueo de restricciones', () => {
    /**
     * Pruebas unitarias para casos específicos de bloqueo de restricciones
     * Valida: Requisitos 7.1
     */
    it('debe bloquear sedante para manejo conductual', () => {
      const restraint: Restraint = {
        id: 'test-1',
        patientId: 'patient-1',
        type: RestraintType.CHEMICAL,
        specificType: 'Sedante lorazepam',
        justification: 'Paciente agitado y no coopera con el cuidado',
        alternatives: ['Música relajante', 'Compañía del cuidador'],
        authorizedBy: 'Dr. García',
        startTime: new Date(),
        reviewSchedule: [new Date()],
        status: RestraintStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = module.validateRestraint(restraint);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.BUSINESS_CHEMICAL_RESTRAINT_BLOCKED);
      expect(result.message).toContain('sedantes');
      expect(result.message).toContain('manejo conductual');
    });

    it('debe permitir sedante para indicación médica', () => {
      const restraint: Restraint = {
        id: 'test-2',
        patientId: 'patient-1',
        type: RestraintType.CHEMICAL,
        specificType: 'Benzodiacepina diazepam',
        justification: 'Trastorno de ansiedad clínica diagnosticado por psiquiatra',
        alternatives: ['Terapia cognitivo-conductual', 'Técnicas de relajación'],
        authorizedBy: 'Dr. Martínez',
        startTime: new Date(),
        reviewSchedule: [new Date()],
        status: RestraintStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = module.validateRestraint(restraint);

      expect(result.isValid).toBe(true);
    });

    it('debe verificar mensaje de advertencia para restricción química bloqueada', () => {
      const restraint: Restraint = {
        id: 'test-3',
        patientId: 'patient-1',
        type: RestraintType.CHEMICAL,
        specificType: 'Antipsicótico haloperidol',
        justification: 'Comportamiento agresivo hacia el cuidador',
        alternatives: ['Técnicas de comunicación', 'Modificación ambiental'],
        authorizedBy: 'Enfermera López',
        startTime: new Date(),
        reviewSchedule: [new Date()],
        status: RestraintStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = module.validateRestraint(restraint);

      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.message).toContain('No se pueden usar sedantes para manejo conductual');
      expect(result.message).toContain('Consulte las estrategias alternativas');
    });

    it('debe bloquear si falta justificación', () => {
      const restraint: Restraint = {
        id: 'test-4',
        patientId: 'patient-1',
        type: RestraintType.MECHANICAL,
        specificType: 'Barandillas laterales',
        justification: '', // Vacío
        alternatives: ['Cama baja', 'Colchón en el suelo'],
        authorizedBy: 'Dr. García',
        startTime: new Date(),
        reviewSchedule: [new Date()],
        status: RestraintStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = module.validateRestraint(restraint);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED);
    });

    it('debe bloquear si faltan alternativas documentadas', () => {
      const restraint: Restraint = {
        id: 'test-5',
        patientId: 'patient-1',
        type: RestraintType.MECHANICAL,
        specificType: 'Cinturón de sujeción',
        justification: 'Riesgo de caída de la silla',
        alternatives: [], // Sin alternativas
        authorizedBy: 'Dr. García',
        startTime: new Date(),
        reviewSchedule: [new Date()],
        status: RestraintStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = module.validateRestraint(restraint);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED);
      expect(result.message).toContain('alternativas');
    });
  });

  describe('Unit Tests: Clasificación de restricciones', () => {
    it('debe clasificar barandillas como mecánica', () => {
      const restraint: Restraint = {
        id: 'test-6',
        patientId: 'patient-1',
        type: undefined as any,
        specificType: 'Barandillas laterales completas',
        justification: 'Prevención de caídas nocturnas',
        alternatives: ['Cama baja', 'Sensores de movimiento'],
        authorizedBy: 'Dr. García',
        startTime: new Date(),
        reviewSchedule: [new Date()],
        status: RestraintStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const classified = module.classifyRestraint(restraint);

      expect(classified).toBe(RestraintType.MECHANICAL);
    });

    it('debe clasificar cinturón como mecánica', () => {
      const restraint: Restraint = {
        id: 'test-7',
        patientId: 'patient-1',
        type: undefined as any,
        specificType: 'Cinturón de seguridad en silla',
        justification: 'Prevención de caídas',
        alternatives: ['Silla con respaldo alto', 'Supervisión constante'],
        authorizedBy: 'Dr. García',
        startTime: new Date(),
        reviewSchedule: [new Date()],
        status: RestraintStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const classified = module.classifyRestraint(restraint);

      expect(classified).toBe(RestraintType.MECHANICAL);
    });
  });

  describe('Unit Tests: Estrategias alternativas', () => {
    it('debe incluir estrategias de distracción', () => {
      const context = {
        patientId: 'patient-1',
        situation: 'Paciente agitado por la tarde',
        currentRestraints: [],
        riskFactors: [],
      };

      const strategies = module.getAlternativeStrategies(context);

      const distractionStrategies = strategies.filter(
        (s) => s.category === 'DISTRACTION'
      );

      expect(distractionStrategies.length).toBeGreaterThan(0);
      expect(distractionStrategies.some((s) => s.title.includes('recreativas'))).toBe(true);
    });

    it('debe incluir estrategias de comunicación', () => {
      const context = {
        patientId: 'patient-1',
        situation: 'Paciente confuso y desorientado',
        currentRestraints: [],
        riskFactors: [],
      };

      const strategies = module.getAlternativeStrategies(context);

      const communicationStrategies = strategies.filter(
        (s) => s.category === 'COMMUNICATION'
      );

      expect(communicationStrategies.length).toBeGreaterThan(0);
      expect(
        communicationStrategies.some((s) => s.title.includes('comunicación'))
      ).toBe(true);
    });

    it('debe incluir estrategias ambientales', () => {
      const context = {
        patientId: 'patient-1',
        situation: 'Paciente intenta levantarse de la cama',
        currentRestraints: [],
        riskFactors: [],
      };

      const strategies = module.getAlternativeStrategies(context);

      const environmentalStrategies = strategies.filter(
        (s) => s.category === 'ENVIRONMENTAL'
      );

      expect(environmentalStrategies.length).toBeGreaterThan(0);
      expect(environmentalStrategies.some((s) => s.title.includes('entorno'))).toBe(true);
    });
  });

  describe('Unit Tests: Formulario de justificación', () => {
    it('debe crear formulario de justificación con campos requeridos', () => {
      const restraint: Restraint = {
        id: 'test-8',
        patientId: 'patient-1',
        type: RestraintType.MECHANICAL,
        specificType: 'Barandillas laterales',
        justification: 'Riesgo de caída durante la noche',
        alternatives: ['Cama baja', 'Colchón en el suelo', 'Sensores de movimiento'],
        authorizedBy: 'Dr. García',
        startTime: new Date(),
        reviewSchedule: [new Date()],
        status: RestraintStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const form = module.requireJustification(restraint);

      expect(form.restraintId).toBe(restraint.id);
      expect(form.justification).toBe(restraint.justification);
      expect(form.alternatives).toEqual(restraint.alternatives);
      expect(form.authorizedBy).toBe(restraint.authorizedBy);
      expect(form.timestamp).toBeInstanceOf(Date);
    });
  });
});
