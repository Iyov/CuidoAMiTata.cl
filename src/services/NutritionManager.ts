/**
 * Nutrition Manager
 * Gestiona hidratación y planificación dietética según directrices SEGG
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, Priority, NotificationType, MealType, NutritionEventType, NotificationStatus } from '../types/enums';
import type { HydrationStatus, MealPlan, PlannedMeal, NutritionEvent } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';
import { getNotificationService } from './NotificationService';

// Contador para generar IDs únicos
let eventCounter = 0;

/**
 * Gestor de nutrición con hidratación y dieta SEGG
 */
export class NutritionManager {
  /**
   * Programa recordatorios de hidratación para alcanzar objetivo diario
   * 
   * @param patientId - ID del paciente
   * @param targetGlasses - Objetivo de vasos diarios (6-8)
   * @returns Result indicando éxito o error
   */
  async scheduleHydrationReminders(
    patientId: string,
    targetGlasses: number
  ): Promise<Result<void>> {
    try {
      // Validar objetivo de vasos
      if (targetGlasses < 6 || targetGlasses > 8) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'El objetivo de vasos debe estar entre 6 y 8',
        });
      }

      const notificationService = await getNotificationService();
      const now = new Date();
      
      // Programar recordatorios distribuidos durante el día (08:00 - 22:00)
      // Distribuir recordatorios uniformemente según el objetivo
      const startHour = 8; // 08:00
      const endHour = 22; // 22:00
      const totalHours = endHour - startHour;
      const intervalHours = totalHours / targetGlasses;

      for (let i = 0; i < targetGlasses; i++) {
        const reminderTime = new Date(now);
        reminderTime.setHours(startHour + Math.floor(i * intervalHours));
        reminderTime.setMinutes(0);
        reminderTime.setSeconds(0);
        reminderTime.setMilliseconds(0);

        // Si el tiempo ya pasó hoy, programar para mañana
        if (reminderTime < now) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const notification = {
          id: `hydration_${patientId}_${i}_${Date.now()}`,
          patientId,
          type: NotificationType.HYDRATION,
          priority: Priority.MEDIUM,
          message: `Recordatorio de hidratación: Beber un vaso de agua (${i + 1}/${targetGlasses})`,
          scheduledTime: reminderTime,
          isDualAlert: false,
          status: NotificationStatus.SCHEDULED,
          reminderSent: false,
          createdAt: now,
        };

        await notificationService.scheduleNotification(notification);
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al programar recordatorios de hidratación',
        details: error,
      });
    }
  }

  /**
   * Registra ingesta de líquidos y actualiza contador diario
   * 
   * @param patientId - ID del paciente
   * @param glasses - Número de vasos consumidos
   * @param timestamp - Momento del registro
   * @returns Result indicando éxito o error
   */
  async recordFluidIntake(
    patientId: string,
    glasses: number,
    timestamp: Date = new Date()
  ): Promise<Result<void>> {
    try {
      // Validar número de vasos
      if (glasses <= 0) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'El número de vasos debe ser mayor que 0',
        });
      }

      // Crear evento de nutrición
      const nutritionEvent: NutritionEvent = {
        id: `nutrition_${patientId}_${Date.now()}_${eventCounter++}`,
        patientId,
        type: NutritionEventType.HYDRATION,
        fluidGlasses: glasses,
        occurredAt: timestamp,
        notes: '',
        createdAt: new Date(),
      };

      // Guardar evento
      await IndexedDBUtils.put(IndexedDBUtils.STORES.NUTRITION_EVENTS, nutritionEvent);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al registrar ingesta de líquidos',
        details: error,
      });
    }
  }

  /**
   * Obtiene el estado de hidratación diario del paciente
   * 
   * @param patientId - ID del paciente
   * @param targetGlasses - Objetivo de vasos diarios (por defecto 8)
   * @returns Estado de hidratación con contador actualizado
   */
  async getDailyHydrationStatus(
    patientId: string,
    targetGlasses: number = 8
  ): Promise<Result<HydrationStatus>> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Obtener todos los eventos de hidratación del día
      const allEvents = await IndexedDBUtils.getByIndex(
        IndexedDBUtils.STORES.NUTRITION_EVENTS,
        'patientId',
        patientId
      );

      // Filtrar eventos de hidratación del día actual
      const todayEvents = (allEvents as NutritionEvent[]).filter(
        (event) =>
          event.type === NutritionEventType.HYDRATION &&
          new Date(event.occurredAt) >= today &&
          new Date(event.occurredAt) < tomorrow
      );

      // Sumar vasos consumidos
      const currentGlasses = todayEvents.reduce(
        (sum, event) => sum + (event.fluidGlasses || 0),
        0
      );

      const percentage = Math.min((currentGlasses / targetGlasses) * 100, 100);

      const status: HydrationStatus = {
        patientId,
        date: today,
        targetGlasses,
        currentGlasses,
        percentage,
      };

      return Ok(status);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al obtener estado de hidratación',
        details: error,
      });
    }
  }

  /**
   * Genera un plan de comidas conforme a directrices SEGG
   * 
   * @param patientId - ID del paciente
   * @returns Plan de comidas con 5 ingestas diarias
   */
  async generateSEGGMealPlan(patientId: string): Promise<Result<MealPlan>> {
    try {
      const now = new Date();
      
      // Alimentos recomendados por SEGG
      const seggFoods = {
        pescado: ['Salmón', 'Merluza', 'Sardinas', 'Atún'],
        aceiteOliva: ['Aceite de oliva virgen extra'],
        yogur: ['Yogur natural', 'Yogur griego'],
        frutas: ['Manzana', 'Naranja', 'Plátano', 'Pera'],
        verduras: ['Espinacas', 'Brócoli', 'Zanahoria', 'Tomate'],
        legumbres: ['Lentejas', 'Garbanzos', 'Judías'],
        cereales: ['Avena', 'Pan integral', 'Arroz integral'],
        frutos_secos: ['Nueces', 'Almendras'],
      };

      // Crear 5 comidas diarias según SEGG
      const meals: PlannedMeal[] = [
        {
          mealType: MealType.BREAKFAST,
          time: this.setTimeOfDay(now, 8, 0),
          recommendedFoods: [
            'Yogur natural con avena',
            'Pan integral con aceite de oliva virgen extra',
            'Naranja',
          ],
          notes: 'Desayuno completo con lácteos, cereales integrales y fruta',
        },
        {
          mealType: MealType.MID_MORNING,
          time: this.setTimeOfDay(now, 11, 0),
          recommendedFoods: ['Fruta (manzana o pera)', 'Puñado de nueces'],
          notes: 'Tentempié ligero a media mañana',
        },
        {
          mealType: MealType.LUNCH,
          time: this.setTimeOfDay(now, 14, 0),
          recommendedFoods: [
            'Ensalada con aceite de oliva virgen extra',
            'Pescado (salmón o merluza) al horno',
            'Verduras al vapor',
            'Pan integral',
            'Fruta de temporada',
          ],
          notes: 'Comida principal con pescado, verduras y aceite de oliva',
        },
        {
          mealType: MealType.SNACK,
          time: this.setTimeOfDay(now, 17, 30),
          recommendedFoods: ['Yogur griego', 'Puñado de almendras'],
          notes: 'Merienda con lácteos y frutos secos',
        },
        {
          mealType: MealType.DINNER,
          time: this.setTimeOfDay(now, 20, 30),
          recommendedFoods: [
            'Crema de verduras',
            'Tortilla con espinacas',
            'Pan integral',
            'Yogur natural',
          ],
          notes: 'Cena ligera con verduras, huevo y lácteos',
        },
      ];

      const mealPlan: MealPlan = {
        id: `meal_plan_${patientId}_${Date.now()}`,
        patientId,
        meals,
        seggCompliant: true,
        createdAt: now,
      };

      // Guardar plan de comidas
      await IndexedDBUtils.put(IndexedDBUtils.STORES.MEAL_PLANS, mealPlan);

      return Ok(mealPlan);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al generar plan de comidas SEGG',
        details: error,
      });
    }
  }

  /**
   * Registra ingesta de comida con timestamp
   * 
   * @param patientId - ID del paciente
   * @param mealType - Tipo de comida
   * @param foodItems - Alimentos consumidos
   * @param timestamp - Momento del registro
   * @returns Result indicando éxito o error
   */
  async recordMealIntake(
    patientId: string,
    mealType: MealType,
    foodItems: string[],
    timestamp: Date = new Date()
  ): Promise<Result<void>> {
    try {
      // Validar que hay alimentos
      if (!foodItems || foodItems.length === 0) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'Debe especificar al menos un alimento',
        });
      }

      // Crear evento de nutrición
      const nutritionEvent: NutritionEvent = {
        id: `nutrition_${patientId}_${Date.now()}_${eventCounter++}`,
        patientId,
        type: NutritionEventType.MEAL,
        mealType,
        foodItems,
        occurredAt: timestamp,
        notes: '',
        createdAt: new Date(),
      };

      // Guardar evento
      await IndexedDBUtils.put(IndexedDBUtils.STORES.NUTRITION_EVENTS, nutritionEvent);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al registrar ingesta de comida',
        details: error,
      });
    }
  }

  /**
   * Establece hora específica del día
   */
  private setTimeOfDay(date: Date, hours: number, minutes: number): Date {
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
}

// Instancia singleton del servicio
let nutritionManagerInstance: NutritionManager | null = null;

/**
 * Obtiene la instancia singleton del NutritionManager
 */
export function getNutritionManager(): NutritionManager {
  if (!nutritionManagerInstance) {
    nutritionManagerInstance = new NutritionManager();
  }
  return nutritionManagerInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetNutritionManager(): void {
  nutritionManagerInstance = null;
}
