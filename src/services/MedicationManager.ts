/**
 * Medication Manager
 * Gestiona programación, notificaciones y registro de administración de medicamentos
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, Priority, NotificationType, MedicationEventStatus } from '../types/enums';
import type {
  Medication,
  Schedule,
  MedicationSheet,
  Confirmation,
  MedicationEvent,
  Notification,
} from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';
import { getNotificationService } from './NotificationService';
import { getValidationService } from './ValidationService';

/**
 * Gestor de medicamentos con lógica de programación y alertas
 */
export class MedicationManager {
  /**
   * Programa un medicamento con su horario
   * 
   * @param medication - Medicamento a programar
   * @param schedule - Horario de administración
   * @returns Result indicando éxito o error
   */
  async scheduleMedication(medication: Medication, schedule: Schedule): Promise<Result<void>> {
    try {
      // Validar campos requeridos
      const validationService = getValidationService();
      
      const nameValidation = validationService.validateRequiredField(medication.name, 'nombre');
      if (!nameValidation.isValid) {
        return Err({
          code: nameValidation.errorCode!,
          message: nameValidation.message!,
        });
      }

      const dosageValidation = validationService.validateRequiredField(medication.dosage, 'dosis');
      if (!dosageValidation.isValid) {
        return Err({
          code: dosageValidation.errorCode!,
          message: dosageValidation.message!,
        });
      }

      // Asignar el schedule al medicamento
      medication.schedule = schedule;
      medication.isActive = true;

      // Guardar medicamento en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.MEDICATIONS, medication);

      // Programar notificaciones para cada horario
      const notificationService = await getNotificationService();
      
      for (const time of schedule.times) {
        // Crear notificación para este horario
        const notification: Notification = {
          id: `med-${medication.id}-${time.getTime()}`,
          patientId: medication.patientId,
          type: NotificationType.MEDICATION,
          priority: Priority.HIGH, // Medicamentos son alta prioridad
          message: `Hora de administrar: ${medication.name} (${medication.dosage})`,
          scheduledTime: time,
          isDualAlert: true, // Requisito 1.1: alertas duales para medicamentos
          status: 'SCHEDULED' as any,
          reminderSent: false,
          createdAt: new Date(),
        };

        // Programar la notificación
        const result = await notificationService.scheduleNotification(notification);
        if (!result.ok) {
          console.error(`Error al programar notificación para ${medication.name}:`, result.error);
        }

        // Crear evento de medicación pendiente
        const medicationEvent: MedicationEvent = {
          id: `event-${medication.id}-${time.getTime()}`,
          medicationId: medication.id,
          patientId: medication.patientId,
          scheduledTime: time,
          status: MedicationEventStatus.PENDING,
          withinAdherenceWindow: false,
          createdAt: new Date(),
        };

        await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, medicationEvent);
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al programar medicamento',
        details: error,
      });
    }
  }

  /**
   * Confirma la administración de un medicamento
   * Valida que ocurra dentro de la ventana de adherencia (3 horas)
   * 
   * @param medicationId - ID del medicamento administrado
   * @param timestamp - Momento de administración
   * @returns Result con confirmación o error
   */
  async confirmAdministration(
    medicationId: string,
    timestamp: Date
  ): Promise<Result<Confirmation>> {
    try {
      // Buscar el medicamento
      const medication = await IndexedDBUtils.getById<Medication>(
        IndexedDBUtils.STORES.MEDICATIONS,
        medicationId
      );

      if (!medication) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: `Medicamento con ID ${medicationId} no encontrado`,
        });
      }

      // Buscar el evento de medicación más cercano al timestamp
      const allEvents = await IndexedDBUtils.getByIndex<MedicationEvent>(
        IndexedDBUtils.STORES.CARE_EVENTS,
        'patientId',
        medication.patientId
      );

      // Filtrar eventos de este medicamento que estén pendientes
      const pendingEvents = allEvents.filter(
        (e) =>
          (e as any).medicationId === medicationId &&
          e.status === MedicationEventStatus.PENDING
      );

      if (pendingEvents.length === 0) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'No hay eventos pendientes para este medicamento',
        });
      }

      // Encontrar el evento más cercano al timestamp de confirmación
      let closestEvent = pendingEvents[0];
      let minDiff = Math.abs(timestamp.getTime() - closestEvent.scheduledTime.getTime());

      for (const event of pendingEvents) {
        const diff = Math.abs(timestamp.getTime() - event.scheduledTime.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestEvent = event;
        }
      }

      // Validar ventana de adherencia (Requisito 1.3)
      const validationService = getValidationService();
      const withinWindow = validationService.validateAdherenceWindow(
        closestEvent.scheduledTime,
        timestamp
      );

      if (!withinWindow) {
        return Err({
          code: ErrorCode.VALIDATION_ADHERENCE_WINDOW,
          message: 'La administración debe ocurrir dentro de 3 horas del horario programado',
        });
      }

      // Actualizar el evento
      closestEvent.actualTime = timestamp;
      closestEvent.status = MedicationEventStatus.CONFIRMED;
      closestEvent.withinAdherenceWindow = true;

      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, closestEvent);

      // Cancelar la notificación asociada
      const notificationService = await getNotificationService();
      const notificationId = `med-${medicationId}-${closestEvent.scheduledTime.getTime()}`;
      await notificationService.cancelNotification(notificationId);

      // Crear confirmación
      const confirmation: Confirmation = {
        medicationEventId: closestEvent.id,
        confirmedAt: timestamp,
        withinWindow: true,
      };

      return Ok(confirmation);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al confirmar administración',
        details: error,
      });
    }
  }

  /**
   * Registra la omisión de una dosis
   * Requiere justificación obligatoria (Requisito 1.5)
   * 
   * @param medicationId - ID del medicamento omitido
   * @param justification - Justificación obligatoria
   * @param timestamp - Momento de la omisión
   * @returns Result indicando éxito o error
   */
  async omitDose(
    medicationId: string,
    justification: string,
    timestamp: Date
  ): Promise<Result<void>> {
    try {
      // Validar justificación obligatoria (Requisito 1.5)
      const validationService = getValidationService();
      const justificationValidation = validationService.validateRequiredField(
        justification,
        'justificación'
      );

      if (!justificationValidation.isValid) {
        return Err({
          code: ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED,
          message: 'Debe proporcionar una justificación para omitir esta dosis',
        });
      }

      // Buscar el medicamento
      const medication = await IndexedDBUtils.getById<Medication>(
        IndexedDBUtils.STORES.MEDICATIONS,
        medicationId
      );

      if (!medication) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: `Medicamento con ID ${medicationId} no encontrado`,
        });
      }

      // Buscar el evento de medicación más cercano al timestamp
      const allEvents = await IndexedDBUtils.getByIndex<MedicationEvent>(
        IndexedDBUtils.STORES.CARE_EVENTS,
        'patientId',
        medication.patientId
      );

      // Filtrar eventos de este medicamento que estén pendientes
      const pendingEvents = allEvents.filter(
        (e) =>
          (e as any).medicationId === medicationId &&
          e.status === MedicationEventStatus.PENDING
      );

      if (pendingEvents.length === 0) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'No hay eventos pendientes para este medicamento',
        });
      }

      // Encontrar el evento más cercano al timestamp
      let closestEvent = pendingEvents[0];
      let minDiff = Math.abs(timestamp.getTime() - closestEvent.scheduledTime.getTime());

      for (const event of pendingEvents) {
        const diff = Math.abs(timestamp.getTime() - event.scheduledTime.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestEvent = event;
        }
      }

      // Actualizar el evento con la omisión
      closestEvent.actualTime = timestamp;
      closestEvent.status = MedicationEventStatus.OMITTED;
      closestEvent.justification = justification;
      closestEvent.withinAdherenceWindow = false;

      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, closestEvent);

      // Cancelar la notificación asociada
      const notificationService = await getNotificationService();
      const notificationId = `med-${medicationId}-${closestEvent.scheduledTime.getTime()}`;
      await notificationService.cancelNotification(notificationId);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al registrar omisión de dosis',
        details: error,
      });
    }
  }

  /**
   * Obtiene la hoja de medicamentos de un paciente
   * 
   * @param patientId - ID del paciente (opcional, si no se proporciona devuelve todos)
   * @returns Hoja de medicamentos
   */
  async getMedicationSheet(patientId?: string): Promise<MedicationSheet> {
    try {
      let medications: Medication[];

      if (patientId) {
        // Obtener medicamentos del paciente específico
        medications = await IndexedDBUtils.getByIndex<Medication>(
          IndexedDBUtils.STORES.MEDICATIONS,
          'patientId',
          patientId
        );
      } else {
        // Obtener todos los medicamentos
        medications = await IndexedDBUtils.getAll<Medication>(
          IndexedDBUtils.STORES.MEDICATIONS
        );
      }

      // Filtrar solo medicamentos activos
      const activeMedications = medications.filter((m) => m.isActive);

      return {
        patientId: patientId || 'all',
        medications: activeMedications,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error al obtener hoja de medicamentos:', error);
      return {
        patientId: patientId || 'all',
        medications: [],
        generatedAt: new Date(),
      };
    }
  }

  /**
   * Verifica si una administración está dentro de la ventana de adherencia
   * 
   * @param scheduledTime - Hora programada
   * @param actualTime - Hora real de administración
   * @returns true si está dentro de la ventana, false si no
   */
  checkAdherenceWindow(scheduledTime: Date, actualTime: Date): boolean {
    const validationService = getValidationService();
    return validationService.validateAdherenceWindow(scheduledTime, actualTime);
  }
}

// Instancia singleton del servicio
let medicationManagerInstance: MedicationManager | null = null;

/**
 * Obtiene la instancia singleton del MedicationManager
 */
export function getMedicationManager(): MedicationManager {
  if (!medicationManagerInstance) {
    medicationManagerInstance = new MedicationManager();
  }
  return medicationManagerInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetMedicationManager(): void {
  medicationManagerInstance = null;
}
