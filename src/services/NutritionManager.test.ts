/**
 * Tests for NutritionManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  NutritionManager,
  getNutritionManager,
  resetNutritionManager,
} from './NutritionManager';
import { resetNotificationService } from './NotificationService';
import { MealType, NutritionEventType, ErrorCode } from '../types/enums';
import type { MealPlan, NutritionEvent, HydrationStatus } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

// Mock IndexedDB utilities con almacenamiento en memoria
const mockStorage: Record<string, Record<string, any>> = {
  patients: {},
  medications: {},
  careEvents: {},
  notifications: {},
  syncQueue: {},
  encrypted_data: {},
  nutritionEvents: {},
  mealPlans: {},
};

vi.mock('../utils/indexedDB', () => ({
  STORES: {
    PATIENTS: 'patients',
    MEDICATIONS: 'medications',
    CARE_EVENTS: 'careEvents',
    NOTIFICATIONS: 'notifications',
    SYNC_QUEUE: 'syncQueue',
    ENCRYPTED_DATA: 'encrypted_data',
    NUTRITION_EVENTS: 'nutritionEvents',
    MEAL_PLANS: 'mealPlans',
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

describe('NutritionManager', () => {
  let manager: NutritionManager;

  beforeEach(() => {
    // Limpiar almacenamiento mock
    mockStorage.patients = {};
    mockStorage.medications = {};
    mockStorage.careEvents = {};
    mockStorage.notifications = {};
    mockStorage.syncQueue = {};
    mockStorage.encrypted_data = {};
    mockStorage.nutritionEvents = {};
    mockStorage.mealPlans = {};

    resetNutritionManager();
    resetNotificationService();
    manager = getNutritionManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 10: Estructura de plan de comidas SEGG', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 10: Estructura de plan de comidas SEGG
     * Valida: Requisitos 4.3
     * 
     * Para cualquier plan de comidas generado, el sistema debe estructurarlo
     * en exactamente 5 ingestas diarias.
     */
    it('debe generar plan de comidas con exactamente 5 ingestas diarias', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // patientId
          async (patientId) => {
            // Generar plan de comidas SEGG
            const result = await manager.generateSEGGMealPlan(patientId);

            // Verificar que el resultado es exitoso
            expect(result.ok).toBe(true);
            if (!result.ok) return false;

            const mealPlan = result.value;

            // Propiedad: El plan debe tener exactamente 5 comidas
            const hasExactly5Meals = mealPlan.meals.length === 5;

            // Verificar que incluye todos los tipos de comida SEGG
            const mealTypes = mealPlan.meals.map((m) => m.mealType);
            const hasBreakfast = mealTypes.includes(MealType.BREAKFAST);
            const hasMidMorning = mealTypes.includes(MealType.MID_MORNING);
            const hasLunch = mealTypes.includes(MealType.LUNCH);
            const hasSnack = mealTypes.includes(MealType.SNACK);
            const hasDinner = mealTypes.includes(MealType.DINNER);

            const hasAllMealTypes =
              hasBreakfast && hasMidMorning && hasLunch && hasSnack && hasDinner;

            // Verificar que está marcado como conforme a SEGG
            const isSeggCompliant = mealPlan.seggCompliant === true;

            // Verificar que cada comida tiene alimentos recomendados
            const allMealsHaveFoods = mealPlan.meals.every(
              (meal) => meal.recommendedFoods && meal.recommendedFoods.length > 0
            );

            return hasExactly5Meals && hasAllMealTypes && isSeggCompliant && allMealsHaveFoods;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe incluir alimentos SEGG en el plan de comidas', async () => {
      const patientId = 'patient-test-segg';
      const result = await manager.generateSEGGMealPlan(patientId);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const mealPlan = result.value;

      // Verificar que el plan incluye alimentos SEGG clave
      const allFoods = mealPlan.meals.flatMap((meal) => meal.recommendedFoods.join(' '));

      // Alimentos SEGG requeridos
      const hasYogur = /yogur/i.test(allFoods);
      const hasPescado = /pescado|salmón|merluza/i.test(allFoods);
      const hasAceiteOliva = /aceite de oliva/i.test(allFoods);

      expect(hasYogur).toBe(true);
      expect(hasPescado).toBe(true);
      expect(hasAceiteOliva).toBe(true);
    });
  });

  describe('Property 11: Actualización de contador de hidratación', () => {
    /**
     * Feature: cuido-a-mi-tata, Property 11: Actualización de contador de hidratación
     * Valida: Requisitos 4.4
     * 
     * Para cualquier registro de ingesta de líquidos, el sistema debe incrementar
     * el contador diario de vasos por la cantidad registrada.
     */
    it('debe incrementar el contador diario por la cantidad registrada', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // patientId
          fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 1, maxLength: 10 }), // registros de vasos
          async (patientId, glassesArray) => {
            // Limpiar eventos previos para este paciente específico
            const allEvents = Object.values(mockStorage.nutritionEvents) as NutritionEvent[];
            allEvents.forEach((event) => {
              if (event.patientId === patientId) {
                delete mockStorage.nutritionEvents[event.id];
              }
            });

            // Registrar múltiples ingestas de líquidos
            for (const glasses of glassesArray) {
              const result = await manager.recordFluidIntake(patientId, glasses);
              if (!result.ok) return false;
            }

            // Obtener estado de hidratación
            const statusResult = await manager.getDailyHydrationStatus(patientId, 8);
            if (!statusResult.ok) return false;

            const status = statusResult.value;

            // Calcular total esperado
            const expectedTotal = glassesArray.reduce((sum, g) => sum + g, 0);

            // Propiedad: El contador debe reflejar la suma de todos los registros
            return status.currentGlasses === expectedTotal;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('debe calcular correctamente el porcentaje de hidratación', async () => {
      const patientId = 'patient-hydration-test-unique-' + Date.now();
      const targetGlasses = 8;

      // Registrar 4 vasos (50% del objetivo)
      const result1 = await manager.recordFluidIntake(patientId, 2);
      expect(result1.ok).toBe(true);
      
      const result2 = await manager.recordFluidIntake(patientId, 2);
      expect(result2.ok).toBe(true);

      const result = await manager.getDailyHydrationStatus(patientId, targetGlasses);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const status = result.value;

      expect(status.currentGlasses).toBe(4);
      expect(status.targetGlasses).toBe(8);
      expect(status.percentage).toBe(50);
    });

    it('debe limitar el porcentaje a 100% cuando se excede el objetivo', async () => {
      const patientId = 'patient-over-hydration';
      const targetGlasses = 8;

      // Registrar 10 vasos (125% del objetivo)
      await manager.recordFluidIntake(patientId, 10);

      const result = await manager.getDailyHydrationStatus(patientId, targetGlasses);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const status = result.value;

      expect(status.currentGlasses).toBe(10);
      expect(status.percentage).toBe(100); // Limitado a 100%
    });
  });

  describe('scheduleHydrationReminders', () => {
    it('debe programar recordatorios para objetivo válido (6-8 vasos)', async () => {
      const patientId = 'patient-reminders';
      const targetGlasses = 7;

      const result = await manager.scheduleHydrationReminders(patientId, targetGlasses);

      expect(result.ok).toBe(true);

      // Verificar que se programaron notificaciones
      const notifications = Object.values(mockStorage.notifications);
      expect(notifications.length).toBe(targetGlasses);
    });

    it('debe rechazar objetivo fuera del rango 6-8', async () => {
      const patientId = 'patient-invalid';

      // Objetivo muy bajo
      const resultLow = await manager.scheduleHydrationReminders(patientId, 5);
      expect(resultLow.ok).toBe(false);
      if (!resultLow.ok) {
        expect(resultLow.error.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
      }

      // Objetivo muy alto
      const resultHigh = await manager.scheduleHydrationReminders(patientId, 9);
      expect(resultHigh.ok).toBe(false);
      if (!resultHigh.ok) {
        expect(resultHigh.error.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
      }
    });
  });

  describe('recordFluidIntake', () => {
    it('debe registrar ingesta de líquidos con timestamp', async () => {
      const patientId = 'patient-fluid';
      const glasses = 2;
      const timestamp = new Date('2024-01-15T10:30:00');

      const result = await manager.recordFluidIntake(patientId, glasses, timestamp);

      expect(result.ok).toBe(true);

      // Verificar que se guardó el evento
      const events = Object.values(mockStorage.nutritionEvents) as NutritionEvent[];
      expect(events.length).toBe(1);
      expect(events[0].patientId).toBe(patientId);
      expect(events[0].type).toBe(NutritionEventType.HYDRATION);
      expect(events[0].fluidGlasses).toBe(glasses);
      expect(new Date(events[0].occurredAt).getTime()).toBe(timestamp.getTime());
    });

    it('debe rechazar número de vasos inválido', async () => {
      const patientId = 'patient-invalid-glasses';

      const result = await manager.recordFluidIntake(patientId, 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
      }
    });
  });

  describe('recordMealIntake', () => {
    it('debe registrar ingesta de comida con timestamp', async () => {
      const patientId = 'patient-meal';
      const mealType = MealType.LUNCH;
      const foodItems = ['Ensalada', 'Pescado', 'Fruta'];
      const timestamp = new Date('2024-01-15T14:00:00');

      const result = await manager.recordMealIntake(patientId, mealType, foodItems, timestamp);

      expect(result.ok).toBe(true);

      // Verificar que se guardó el evento
      const events = Object.values(mockStorage.nutritionEvents) as NutritionEvent[];
      expect(events.length).toBe(1);
      expect(events[0].patientId).toBe(patientId);
      expect(events[0].type).toBe(NutritionEventType.MEAL);
      expect(events[0].mealType).toBe(mealType);
      expect(events[0].foodItems).toEqual(foodItems);
      expect(new Date(events[0].occurredAt).getTime()).toBe(timestamp.getTime());
    });

    it('debe rechazar registro sin alimentos', async () => {
      const patientId = 'patient-no-food';
      const mealType = MealType.BREAKFAST;

      const result = await manager.recordMealIntake(patientId, mealType, []);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });
  });

  describe('getDailyHydrationStatus', () => {
    it('debe filtrar solo eventos del día actual', async () => {
      const patientId = 'patient-daily-filter';
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Registrar evento de ayer
      await manager.recordFluidIntake(patientId, 3, yesterday);

      // Registrar evento de hoy
      await manager.recordFluidIntake(patientId, 2, today);

      const result = await manager.getDailyHydrationStatus(patientId, 8);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Solo debe contar los vasos de hoy
      expect(result.value.currentGlasses).toBe(2);
    });
  });
});
