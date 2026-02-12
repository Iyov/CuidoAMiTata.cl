/**
 * Notification Service
 * Gestiona emisión y programación de notificaciones con alertas duales
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, Priority, NotificationStatus } from '../types/enums';
import type { Notification, NotificationPreferences } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

/**
 * Servicio de notificaciones con alertas duales
 */
export class NotificationService {
  private reminderTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private audioContext: AudioContext | null = null;

  /**
   * Inicializa el servicio de notificaciones
   */
  async initialize(): Promise<Result<void>> {
    try {
      // Inicializar AudioContext para alertas de audio
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        this.audioContext = new AudioContext();
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al inicializar el servicio de notificaciones',
        details: error,
      });
    }
  }

  /**
   * Programa una notificación para un momento específico
   * 
   * @param notification - Notificación a programar
   * @returns Result con el ID de la notificación programada
   */
  async scheduleNotification(notification: Notification): Promise<Result<string>> {
    try {
      // Validar que la notificación tenga los campos requeridos
      if (!notification.id || !notification.patientId || !notification.scheduledTime) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'La notificación debe tener id, patientId y scheduledTime',
        });
      }

      // Establecer automáticamente isDualAlert=true para notificaciones CRITICAL y HIGH
      // Requisito 11.2: Las notificaciones críticas deben usar alertas duales
      if (notification.priority === Priority.CRITICAL || notification.priority === Priority.HIGH) {
        notification.isDualAlert = true;
      }

      // Guardar notificación en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);

      // Calcular tiempo hasta la notificación
      const now = new Date();
      const scheduledTime = new Date(notification.scheduledTime);
      const delay = scheduledTime.getTime() - now.getTime();

      // Si la notificación es para el futuro, programarla
      if (delay > 0) {
        setTimeout(() => {
          this.emitNotification(notification.id);
        }, delay);
      } else {
        // Si es para ahora o el pasado, emitirla inmediatamente
        await this.emitNotification(notification.id);
      }

      return Ok(notification.id);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al programar notificación',
        details: error,
      });
    }
  }

  /**
   * Emite una notificación programada
   * 
   * @param notificationId - ID de la notificación a emitir
   */
  private async emitNotification(notificationId: string): Promise<void> {
    try {
      // Recuperar notificación
      const notification = await IndexedDBUtils.getById<Notification>(
        IndexedDBUtils.STORES.NOTIFICATIONS,
        notificationId
      );

      if (!notification) {
        console.error(`Notificación ${notificationId} no encontrada`);
        return;
      }

      // Emitir alerta según prioridad
      if (notification.isDualAlert) {
        await this.emitDualAlert(notification.message, notification.priority);
      } else {
        await this.emitVisualAlert(notification.message, notification.priority);
      }

      // Actualizar estado de la notificación
      notification.status = NotificationStatus.SENT;
      await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);

      // Programar recordatorio si no es atendida
      await this.setReminderIfUnattended(notificationId, 15);
    } catch (error) {
      console.error('Error al emitir notificación:', error);
    }
  }

  /**
   * Emite una alerta dual (audio + visual)
   * 
   * @param message - Mensaje de la alerta
   * @param priority - Prioridad de la alerta
   * @returns Result indicando éxito o error
   */
  async emitDualAlert(message: string, priority: Priority): Promise<Result<void>> {
    try {
      // Emitir alerta visual
      await this.emitVisualAlert(message, priority);

      // Emitir alerta de audio
      await this.emitAudioAlert(priority);

      // Emitir vibración si está disponible
      await this.emitVibration(priority);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al emitir alerta dual',
        details: error,
      });
    }
  }

  /**
   * Emite una alerta visual (notificación del navegador o sistema)
   */
  private async emitVisualAlert(message: string, priority: Priority): Promise<void> {
    // Verificar si las notificaciones están soportadas
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notificaciones no soportadas en este entorno');
      return;
    }

    // Solicitar permiso si es necesario
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Emitir notificación si hay permiso
    if (Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body: message,
        icon: '/img/CuidoAMiTata_Logo_500.png',
        badge: '/img/CuidoAMiTata_Logo_500.png',
        tag: `cuido-notification-${Date.now()}`,
        requireInteraction: priority === Priority.CRITICAL || priority === Priority.HIGH,
        silent: false,
      };

      new Notification('CuidoAMiTata', options);
    }
  }

  /**
   * Emite una alerta de audio usando Web Audio API
   */
  private async emitAudioAlert(priority: Priority): Promise<void> {
    if (!this.audioContext) {
      console.warn('AudioContext no disponible');
      return;
    }

    try {
      // Crear oscilador para generar tono
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configurar frecuencia según prioridad
      const frequency = this.getFrequencyForPriority(priority);
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      // Configurar volumen
      gainNode.gain.value = 0.3;

      // Duración según prioridad
      const duration = this.getDurationForPriority(priority);

      // Reproducir tono
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error al emitir alerta de audio:', error);
    }
  }

  /**
   * Emite vibración si está disponible
   */
  private async emitVibration(priority: Priority): Promise<void> {
    if (typeof window === 'undefined' || !('navigator' in window) || !navigator.vibrate) {
      return;
    }

    // Patrón de vibración según prioridad
    const pattern = this.getVibrationPattern(priority);
    navigator.vibrate(pattern);
  }

  /**
   * Obtiene la frecuencia de audio según la prioridad
   */
  private getFrequencyForPriority(priority: Priority): number {
    switch (priority) {
      case Priority.CRITICAL:
        return 880; // A5 - tono alto y urgente
      case Priority.HIGH:
        return 660; // E5 - tono medio-alto
      case Priority.MEDIUM:
        return 523; // C5 - tono medio
      case Priority.LOW:
        return 440; // A4 - tono bajo
      default:
        return 523;
    }
  }

  /**
   * Obtiene la duración del audio según la prioridad
   */
  private getDurationForPriority(priority: Priority): number {
    switch (priority) {
      case Priority.CRITICAL:
        return 1.5; // 1.5 segundos
      case Priority.HIGH:
        return 1.0; // 1 segundo
      case Priority.MEDIUM:
        return 0.7; // 0.7 segundos
      case Priority.LOW:
        return 0.5; // 0.5 segundos
      default:
        return 0.7;
    }
  }

  /**
   * Obtiene el patrón de vibración según la prioridad
   */
  private getVibrationPattern(priority: Priority): number[] {
    switch (priority) {
      case Priority.CRITICAL:
        return [200, 100, 200, 100, 200]; // Tres vibraciones cortas
      case Priority.HIGH:
        return [300, 100, 300]; // Dos vibraciones medianas
      case Priority.MEDIUM:
        return [400]; // Una vibración larga
      case Priority.LOW:
        return [200]; // Una vibración corta
      default:
        return [300];
    }
  }

  /**
   * Programa un recordatorio si la notificación no es atendida
   * 
   * @param notificationId - ID de la notificación
   * @param delayMinutes - Minutos de espera antes del recordatorio
   * @returns Result indicando éxito o error
   */
  async setReminderIfUnattended(
    notificationId: string,
    delayMinutes: number
  ): Promise<Result<void>> {
    try {
      // Limpiar recordatorio existente si hay uno
      const existingTimeout = this.reminderTimeouts.get(notificationId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Programar nuevo recordatorio
      const timeout = setTimeout(async () => {
        // Verificar si la notificación fue atendida
        const notification = await IndexedDBUtils.getById<Notification>(
          IndexedDBUtils.STORES.NOTIFICATIONS,
          notificationId
        );

        if (!notification) {
          return;
        }

        // Si no fue atendida (no está en ACKNOWLEDGED o DISMISSED), emitir recordatorio
        if (
          notification.status !== NotificationStatus.ACKNOWLEDGED &&
          notification.status !== NotificationStatus.DISMISSED
        ) {
          // Emitir recordatorio
          await this.emitDualAlert(
            `Recordatorio: ${notification.message}`,
            notification.priority
          );

          // Marcar que se envió recordatorio
          notification.reminderSent = true;
          await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);
        }

        // Limpiar timeout del mapa
        this.reminderTimeouts.delete(notificationId);
      }, delayMinutes * 60 * 1000);

      // Guardar timeout en el mapa
      this.reminderTimeouts.set(notificationId, timeout);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al programar recordatorio',
        details: error,
      });
    }
  }

  /**
   * Cancela una notificación programada
   * 
   * @param notificationId - ID de la notificación a cancelar
   * @returns Result indicando éxito o error
   */
  async cancelNotification(notificationId: string): Promise<Result<void>> {
    try {
      // Limpiar recordatorio si existe
      const timeout = this.reminderTimeouts.get(notificationId);
      if (timeout) {
        clearTimeout(timeout);
        this.reminderTimeouts.delete(notificationId);
      }

      // Actualizar estado de la notificación
      const notification = await IndexedDBUtils.getById<Notification>(
        IndexedDBUtils.STORES.NOTIFICATIONS,
        notificationId
      );

      if (notification) {
        notification.status = NotificationStatus.DISMISSED;
        await IndexedDBUtils.put(IndexedDBUtils.STORES.NOTIFICATIONS, notification);
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al cancelar notificación',
        details: error,
      });
    }
  }

  /**
   * Prioriza alertas según su nivel de urgencia
   * CRITICAL > HIGH > MEDIUM > LOW
   * 
   * @param alerts - Array de notificaciones a priorizar
   * @returns Array de notificaciones ordenadas por prioridad
   */
  prioritizeAlerts(alerts: Notification[]): Notification[] {
    // Definir orden de prioridad
    const priorityOrder: Record<Priority, number> = {
      [Priority.CRITICAL]: 4,
      [Priority.HIGH]: 3,
      [Priority.MEDIUM]: 2,
      [Priority.LOW]: 1,
    };

    // Ordenar por prioridad (mayor a menor) y luego por tiempo programado (más antiguo primero)
    return [...alerts].sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      // Si tienen la misma prioridad, ordenar por tiempo programado
      if (priorityDiff === 0) {
        return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      }
      
      return priorityDiff;
    });
  }

  /**
   * Obtiene alertas filtradas por nivel de prioridad
   * 
   * @param minPriority - Prioridad mínima a incluir (opcional)
   * @returns Array de notificaciones filtradas y ordenadas por prioridad
   */
  async getAlertsByPriority(minPriority?: Priority): Promise<Notification[]> {
    try {
      // Obtener todas las notificaciones pendientes o enviadas
      const allNotifications = await IndexedDBUtils.getAll<Notification>(
        IndexedDBUtils.STORES.NOTIFICATIONS
      );

      // Filtrar solo alertas pendientes o enviadas (no atendidas ni descartadas)
      let alerts = allNotifications.filter(
        (n) =>
          n.status === NotificationStatus.SCHEDULED ||
          n.status === NotificationStatus.SENT
      );

      // Aplicar filtro de prioridad mínima si se especifica
      if (minPriority) {
        const priorityOrder: Record<Priority, number> = {
          [Priority.CRITICAL]: 4,
          [Priority.HIGH]: 3,
          [Priority.MEDIUM]: 2,
          [Priority.LOW]: 1,
        };

        const minPriorityValue = priorityOrder[minPriority];
        alerts = alerts.filter((n) => priorityOrder[n.priority] >= minPriorityValue);
      }

      // Priorizar y devolver
      return this.prioritizeAlerts(alerts);
    } catch (error) {
      console.error('Error al obtener alertas por prioridad:', error);
      return [];
    }
  }

  /**
   * Obtiene las preferencias de notificación del usuario
   * 
   * @returns Preferencias de notificación
   */
  getUserPreferences(): NotificationPreferences {
    // En una implementación real, esto se obtendría del almacenamiento
    // Por ahora, devolvemos valores por defecto
    return {
      enableSound: true,
      enableVibration: true,
      enablePushNotifications: true,
      priorityFilter: 'ALL',
    };
  }

  /**
   * Limpia todos los recordatorios pendientes
   */
  cleanup(): void {
    this.reminderTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.reminderTimeouts.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Instancia singleton del servicio
let notificationServiceInstance: NotificationService | null = null;

/**
 * Obtiene la instancia singleton del NotificationService
 */
export async function getNotificationService(): Promise<NotificationService> {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
    const result = await notificationServiceInstance.initialize();
    if (!result.ok) {
      throw new Error('Failed to initialize NotificationService');
    }
  }
  return notificationServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetNotificationService(): void {
  if (notificationServiceInstance) {
    notificationServiceInstance.cleanup();
  }
  notificationServiceInstance = null;
}
