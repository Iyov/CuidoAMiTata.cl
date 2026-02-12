/**
 * Pruebas para ValidationService
 * Incluye pruebas basadas en propiedades y pruebas unitarias
 */

import { describe, it, beforeEach, expect } from 'vitest';
import * as fc from 'fast-check';
import { ValidationService, getValidationService, resetValidationService } from './ValidationService';
import { ErrorCode } from '../types/enums';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    resetValidationService();
    validationService = getValidationService();
  });

  describe('Property-Based Tests', () => {
    describe('Propiedad 3: Validación de ventana de adherencia', () => {
      it('debe validar correctamente la ventana de adherencia de 3 horas (±90 minutos)', () => {
        // Feature: cuido-a-mi-tata, Property 3: Validación de ventana de adherencia
        // Valida: Requisitos 1.3
        
        fc.assert(
          fc.property(
            fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            fc.integer({ min: -180, max: 180 }), // minutos de diferencia
            (scheduledTime, minutesDiff) => {
              // Calcular tiempo real de administración
              const actualTime = new Date(scheduledTime.getTime() + minutesDiff * 60000);
              
              // Validar usando el servicio
              const isValid = validationService.validateAdherenceWindow(scheduledTime, actualTime);
              
              // La ventana de adherencia es de ±90 minutos (1.5 horas)
              const expectedValid = Math.abs(minutesDiff) <= 90;
              
              // Verificar que el resultado coincide con lo esperado
              return isValid === expectedValid;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe manejar correctamente casos extremos de la ventana de adherencia', () => {
        // Probar casos límite específicos
        fc.assert(
          fc.property(
            fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            fc.constantFrom(-90, -89, 0, 89, 90, -91, 91), // casos límite
            (scheduledTime, minutesDiff) => {
              const actualTime = new Date(scheduledTime.getTime() + minutesDiff * 60000);
              const isValid = validationService.validateAdherenceWindow(scheduledTime, actualTime);
              const expectedValid = Math.abs(minutesDiff) <= 90;
              
              return isValid === expectedValid;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe ser simétrico respecto al tiempo programado', () => {
        // La ventana debe ser simétrica: +X minutos y -X minutos deben dar el mismo resultado
        fc.assert(
          fc.property(
            fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
            fc.integer({ min: 0, max: 180 }),
            (scheduledTime, minutesDiff) => {
              const actualTimePlus = new Date(scheduledTime.getTime() + minutesDiff * 60000);
              const actualTimeMinus = new Date(scheduledTime.getTime() - minutesDiff * 60000);
              
              const isValidPlus = validationService.validateAdherenceWindow(scheduledTime, actualTimePlus);
              const isValidMinus = validationService.validateAdherenceWindow(scheduledTime, actualTimeMinus);
              
              // Ambos deben dar el mismo resultado (simetría)
              return isValidPlus === isValidMinus;
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Propiedad 9: Validación de elevación de cama', () => {
      it('debe validar correctamente la elevación de cama (máximo 30 grados)', () => {
        // Feature: cuido-a-mi-tata, Property 9: Validación de elevación de cama
        // Valida: Requisitos 3.3
        
        fc.assert(
          fc.property(
            fc.integer({ min: -10, max: 50 }),
            (degrees) => {
              const result = validationService.validateBedElevation(degrees);
              
              // La elevación debe estar entre 0 y 30 grados (inclusive)
              if (degrees >= 0 && degrees <= 30) {
                return result.isValid === true;
              } else {
                return result.isValid === false &&
                       result.errorCode === ErrorCode.VALIDATION_BED_ELEVATION;
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe rechazar valores negativos de elevación', () => {
        // Probar específicamente valores negativos
        fc.assert(
          fc.property(
            fc.integer({ min: -100, max: -1 }),
            (degrees) => {
              const result = validationService.validateBedElevation(degrees);
              
              return result.isValid === false &&
                     result.errorCode === ErrorCode.VALIDATION_BED_ELEVATION &&
                     result.message !== undefined;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe rechazar valores que excedan 30 grados', () => {
        // Probar específicamente valores que exceden el máximo
        fc.assert(
          fc.property(
            fc.integer({ min: 31, max: 100 }),
            (degrees) => {
              const result = validationService.validateBedElevation(degrees);
              
              return result.isValid === false &&
                     result.errorCode === ErrorCode.VALIDATION_BED_ELEVATION &&
                     result.message !== undefined &&
                     result.message.includes('30 grados');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe aceptar valores en el rango válido [0, 30]', () => {
        // Probar específicamente valores válidos
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 30 }),
            (degrees) => {
              const result = validationService.validateBedElevation(degrees);
              
              return result.isValid === true &&
                     result.errorCode === undefined;
            }
          ),
          { numRuns: 100 }
        );
      });

      it('debe manejar correctamente los casos límite exactos', () => {
        // Probar casos límite específicos: 0, 30, 31, -1
        fc.assert(
          fc.property(
            fc.constantFrom(0, 30, 31, -1),
            (degrees) => {
              const result = validationService.validateBedElevation(degrees);
              
              if (degrees === 0 || degrees === 30) {
                return result.isValid === true;
              } else {
                return result.isValid === false &&
                       result.errorCode === ErrorCode.VALIDATION_BED_ELEVATION;
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('Unit Tests - Edge Cases', () => {
    describe('Ventana de adherencia - casos límite', () => {
      it('debe aceptar administración en el tiempo exacto programado', () => {
        const scheduledTime = new Date('2024-01-15T10:00:00');
        const actualTime = new Date('2024-01-15T10:00:00');
        
        const result = validationService.validateAdherenceWindow(scheduledTime, actualTime);
        
        expect(result).toBe(true);
      });

      it('debe aceptar administración exactamente ±1.5 horas (90 minutos)', () => {
        const scheduledTime = new Date('2024-01-15T10:00:00');
        
        // +90 minutos (límite superior)
        const actualTimePlus90 = new Date('2024-01-15T11:30:00');
        const resultPlus90 = validationService.validateAdherenceWindow(scheduledTime, actualTimePlus90);
        expect(resultPlus90).toBe(true);
        
        // -90 minutos (límite inferior)
        const actualTimeMinus90 = new Date('2024-01-15T08:30:00');
        const resultMinus90 = validationService.validateAdherenceWindow(scheduledTime, actualTimeMinus90);
        expect(resultMinus90).toBe(true);
      });

      it('debe rechazar administración a ±2 horas (120 minutos)', () => {
        const scheduledTime = new Date('2024-01-15T10:00:00');
        
        // +120 minutos (fuera de ventana)
        const actualTimePlus120 = new Date('2024-01-15T12:00:00');
        const resultPlus120 = validationService.validateAdherenceWindow(scheduledTime, actualTimePlus120);
        expect(resultPlus120).toBe(false);
        
        // -120 minutos (fuera de ventana)
        const actualTimeMinus120 = new Date('2024-01-15T08:00:00');
        const resultMinus120 = validationService.validateAdherenceWindow(scheduledTime, actualTimeMinus120);
        expect(resultMinus120).toBe(false);
      });

      it('debe rechazar administración justo fuera de la ventana (91 minutos)', () => {
        const scheduledTime = new Date('2024-01-15T10:00:00');
        
        // +91 minutos (justo fuera)
        const actualTimePlus91 = new Date('2024-01-15T11:31:00');
        const resultPlus91 = validationService.validateAdherenceWindow(scheduledTime, actualTimePlus91);
        expect(resultPlus91).toBe(false);
        
        // -91 minutos (justo fuera)
        const actualTimeMinus91 = new Date('2024-01-15T08:29:00');
        const resultMinus91 = validationService.validateAdherenceWindow(scheduledTime, actualTimeMinus91);
        expect(resultMinus91).toBe(false);
      });

      it('debe aceptar administración justo dentro de la ventana (89 minutos)', () => {
        const scheduledTime = new Date('2024-01-15T10:00:00');
        
        // +89 minutos (justo dentro)
        const actualTimePlus89 = new Date('2024-01-15T11:29:00');
        const resultPlus89 = validationService.validateAdherenceWindow(scheduledTime, actualTimePlus89);
        expect(resultPlus89).toBe(true);
        
        // -89 minutos (justo dentro)
        const actualTimeMinus89 = new Date('2024-01-15T08:31:00');
        const resultMinus89 = validationService.validateAdherenceWindow(scheduledTime, actualTimeMinus89);
        expect(resultMinus89).toBe(true);
      });
    });

    describe('Elevación de cama - casos límite', () => {
      it('debe aceptar elevación de 0 grados', () => {
        const result = validationService.validateBedElevation(0);
        
        expect(result.isValid).toBe(true);
        expect(result.errorCode).toBeUndefined();
      });

      it('debe aceptar elevación de 30 grados (límite máximo)', () => {
        const result = validationService.validateBedElevation(30);
        
        expect(result.isValid).toBe(true);
        expect(result.errorCode).toBeUndefined();
      });

      it('debe rechazar elevación de 31 grados (justo por encima del límite)', () => {
        const result = validationService.validateBedElevation(31);
        
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe(ErrorCode.VALIDATION_BED_ELEVATION);
        expect(result.message).toContain('30 grados');
      });

      it('debe rechazar valores negativos', () => {
        const testCases = [-1, -5, -10, -100];
        
        testCases.forEach(degrees => {
          const result = validationService.validateBedElevation(degrees);
          
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe(ErrorCode.VALIDATION_BED_ELEVATION);
          expect(result.message).toContain('negativa');
        });
      });

      it('debe rechazar valores muy por encima del límite', () => {
        const testCases = [45, 60, 90, 100];
        
        testCases.forEach(degrees => {
          const result = validationService.validateBedElevation(degrees);
          
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe(ErrorCode.VALIDATION_BED_ELEVATION);
          expect(result.message).toContain('30 grados');
        });
      });

      it('debe aceptar valores válidos dentro del rango [0, 30]', () => {
        const testCases = [1, 5, 10, 15, 20, 25, 29];
        
        testCases.forEach(degrees => {
          const result = validationService.validateBedElevation(degrees);
          
          expect(result.isValid).toBe(true);
          expect(result.errorCode).toBeUndefined();
        });
      });
    });
  });
});
