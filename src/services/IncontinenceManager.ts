/**
 * Incontinence Manager
 * Gestiona programación de visitas al baño y registro de episodios de incontinencia
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, Priority, NotificationType, IncontinenceEventType, IncontinenceSeverity } from '../types/enums';
import type {
  IncontinenceEvent,
  PatternAnalysis,
  DateRange,
  Notification,
} from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';
import { getNotificationService } from './NotificationService';
import { getValidationService } from './ValidationService';

/**
 * Gestor de incontinencia con programación de baño y análisis de patrones
 */
export class IncontinenceManager {
  /**
   * Programa recordatorios de visita al baño
   * Requisito 5.1: Recordatorios cada 2-3 horas
   * 
   * @param patientId - ID del paciente
   * @param intervalHours - Intervalo en horas (debe estar entre 2 y 3)
   * @returns Result indicando éxito o error
   */
  async scheduleBathroomReminders(
    patientId: string,
    intervalHours: number
  ): Promise<Result<void>> {
    try {
      // Validar que el intervalo esté entre 2 y 3 horas
      if (intervalHours < 2 || intervalHours > 3) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'El intervalo debe estar entre 2 y 3 horas',
        });
      }

      // Validar campos requeridos
      const validationService = getValidationService();
      const patientIdValidation = validationService.validateRequiredField(
        patientId,
        'ID del paciente'
      );

      if (!patientIdValidation.isValid) {
        return Err({
          code: patientIdValidation.errorCode!,
          message: patientIdValidation.message!,
        });
      }

      const notificationService = await getNotificationService();

      // Programar recordatorios para las próximas 24 horas
      const now = new Date();
      const intervalMs = intervalHours * 60 * 60 * 1000;
      const remindersPerDay = Math.floor(24 / intervalHours);

      for (let i = 0; i < remindersPerDay; i++) {
        const scheduledTime = new Date(now.getTime() + (i + 1) * intervalMs);

        const notification: Notification = {
          id: `bathroom-${patientId}-${scheduledTime.getTime()}`,
          patientId,
          type: NotificationType.BATHROOM,
          priority: Priority.MEDIUM,
          message: 'Recordatorio: Hora de visitar el baño',
          scheduledTime,
          isDualAlert: false,
          status: 'SCHEDULED' as any,
          reminderSent: false,
          createdAt: new Date(),
        };

        const result = await notificationService.scheduleNotification(notification);
        if (!result.ok) {
          console.error(
            `Error al programar recordatorio de baño para ${patientId}:`,
            result.error
          );
        }
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al programar recordatorios de baño',
        details: error,
      });
    }
  }

  /**
   * Registra una visita al baño
   * Requisito 5.2: Registro con marca temporal
   * 
   * @param patientId - ID del paciente
   * @param timestamp - Momento de la visita
   * @param success - Si la visita fue exitosa (opcional)
   * @param notes - Notas adicionales (opcional)
   * @returns Result indicando éxito o error
   */
  async recordBathroomVisit(
    patientId: string,
    timestamp: Date,
    success?: boolean,
    notes?: string
  ): Promise<Result<void>> {
    try {
      // Validar campos requeridos
      const validationService = getValidationService();
      const patientIdValidation = validationService.validateRequiredField(
        patientId,
        'ID del paciente'
      );

      if (!patientIdValidation.isValid) {
        return Err({
          code: patientIdValidation.errorCode!,
          message: patientIdValidation.message!,
        });
      }

      // Crear evento de visita al baño
      const event: IncontinenceEvent = {
        id: `bathroom-visit-${patientId}-${timestamp.getTime()}-${Math.random().toString(36).substring(7)}`,
        patientId,
        type: IncontinenceEventType.BATHROOM_VISIT,
        success,
        occurredAt: timestamp,
        notes: notes || '',
        createdAt: new Date(),
      };

      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.INCONTINENCE_EVENTS, event);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al registrar visita al baño',
        details: error,
      });
    }
  }

  /**
   * Registra un episodio de incontinencia
   * Requisito 5.3: Registro con marca temporal
   * 
   * @param patientId - ID del paciente
   * @param timestamp - Momento del episodio
   * @param severity - Severidad del episodio (opcional)
   * @param notes - Notas adicionales (opcional)
   * @returns Result indicando éxito o error
   */
  async recordIncontinenceEpisode(
    patientId: string,
    timestamp: Date,
    severity?: IncontinenceSeverity,
    notes?: string
  ): Promise<Result<void>> {
    try {
      // Validar campos requeridos
      const validationService = getValidationService();
      const patientIdValidation = validationService.validateRequiredField(
        patientId,
        'ID del paciente'
      );

      if (!patientIdValidation.isValid) {
        return Err({
          code: patientIdValidation.errorCode!,
          message: patientIdValidation.message!,
        });
      }

      // Crear evento de episodio
      const event: IncontinenceEvent = {
        id: `incontinence-episode-${patientId}-${timestamp.getTime()}-${Math.random().toString(36).substring(7)}`,
        patientId,
        type: IncontinenceEventType.EPISODE,
        severity,
        occurredAt: timestamp,
        notes: notes || '',
        createdAt: new Date(),
      };

      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.INCONTINENCE_EVENTS, event);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al registrar episodio de incontinencia',
        details: error,
      });
    }
  }

  /**
   * Analiza patrones de incontinencia
   * Requisito 5.4: Análisis de tendencias
   * 
   * @param patientId - ID del paciente
   * @param dateRange - Rango de fechas para el análisis
   * @returns Análisis de patrones
   */
  async analyzePatterns(patientId: string, dateRange: DateRange): Promise<PatternAnalysis> {
    try {
      // Obtener todos los eventos del paciente
      const allEvents = await IndexedDBUtils.getByIndex<IncontinenceEvent>(
        IndexedDBUtils.STORES.INCONTINENCE_EVENTS,
        'patientId',
        patientId
      );

      // Filtrar eventos dentro del rango de fechas
      const eventsInRange = allEvents.filter((event) => {
        const eventDate = new Date(event.occurredAt);
        return eventDate >= dateRange.start && eventDate <= dateRange.end;
      });

      // Calcular estadísticas
      const totalEvents = eventsInRange.length;
      const daysDiff =
        Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) ||
        1;
      const averagePerDay = totalEvents / daysDiff;

      // Analizar tendencias
      const trends: string[] = [];

      // Contar episodios vs visitas exitosas
      const episodes = eventsInRange.filter(
        (e) => e.type === IncontinenceEventType.EPISODE
      ).length;
      const bathroomVisits = eventsInRange.filter(
        (e) => e.type === IncontinenceEventType.BATHROOM_VISIT
      ).length;
      const successfulVisits = eventsInRange.filter(
        (e) => e.type === IncontinenceEventType.BATHROOM_VISIT && e.success === true
      ).length;

      if (episodes > 0) {
        trends.push(`${episodes} episodio(s) de incontinencia registrado(s)`);
      }

      if (bathroomVisits > 0) {
        const successRate = successfulVisits / bathroomVisits;
        trends.push(
          `${bathroomVisits} visita(s) al baño registrada(s) (${Math.round(successRate * 100)}% exitosas)`
        );
      }

      if (averagePerDay > 3) {
        trends.push('Frecuencia elevada de eventos');
      } else if (averagePerDay < 1) {
        trends.push('Frecuencia baja de eventos');
      } else {
        trends.push('Frecuencia normal de eventos');
      }

      // Analizar patrones por hora del día
      const hourCounts: Record<number, number> = {};
      eventsInRange.forEach((event) => {
        const hour = new Date(event.occurredAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const maxHour = Object.entries(hourCounts).reduce(
        (max, [hour, count]) => (count > max.count ? { hour: parseInt(hour), count } : max),
        { hour: 0, count: 0 }
      );

      if (maxHour.count > 0) {
        trends.push(`Mayor frecuencia entre las ${maxHour.hour}:00 y ${maxHour.hour + 1}:00`);
      }

      return {
        patientId,
        dateRange,
        totalEvents,
        averagePerDay: Math.round(averagePerDay * 100) / 100,
        trends,
      };
    } catch (error) {
      console.error('Error al analizar patrones:', error);
      return {
        patientId,
        dateRange,
        totalEvents: 0,
        averagePerDay: 0,
        trends: ['Error al analizar patrones'],
      };
    }
  }
}

// Instancia singleton del servicio
let incontinenceManagerInstance: IncontinenceManager | null = null;

/**
 * Obtiene la instancia singleton del IncontinenceManager
 */
export function getIncontinenceManager(): IncontinenceManager {
  if (!incontinenceManagerInstance) {
    incontinenceManagerInstance = new IncontinenceManager();
  }
  return incontinenceManagerInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetIncontinenceManager(): void {
  incontinenceManagerInstance = null;
}
