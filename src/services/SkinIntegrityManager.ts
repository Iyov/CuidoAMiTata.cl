/**
 * Skin Integrity Manager
 * Gestiona cambios posturales y monitoreo de úlceras por presión
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, NotificationType, Position, Priority, UlcerGrade } from '../types/enums';
import type {
  PosturalChange,
  PressureUlcer,
  Photo,
  Notification,
} from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';
import { getNotificationService } from './NotificationService';
import { getValidationService } from './ValidationService';

/**
 * Gestor de integridad de piel con cambios posturales
 */
export class SkinIntegrityManager {
  /**
   * Programa cambios posturales según horarios diurnos y nocturnos
   * Día (06:00-22:00): cada 2 horas
   * Noche (22:00-06:00): 3 veces
   * 
   * @param patientId - ID del paciente
   * @returns Result con void o error
   */
  async schedulePosturalChanges(patientId: string): Promise<Result<void>> {
    try {
      const notificationService = await getNotificationService();
      const now = new Date();
      
      // Programar notificaciones diurnas (06:00-22:00, cada 2 horas)
      // 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00 = 8 notificaciones
      const dayHours = [6, 8, 10, 12, 14, 16, 18, 20];
      
      for (const hour of dayHours) {
        const scheduledTime = new Date(now);
        scheduledTime.setHours(hour, 0, 0, 0);
        
        // Si la hora ya pasó hoy, programar para mañana
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const notification: Notification = {
          id: `postural-day-${patientId}-${hour}`,
          patientId,
          type: NotificationType.POSTURAL_CHANGE,
          priority: Priority.HIGH,
          message: `Cambio postural programado - ${hour}:00`,
          scheduledTime,
          isDualAlert: true,
          status: 'SCHEDULED' as any,
          reminderSent: false,
          createdAt: now,
        };
        
        await notificationService.scheduleNotification(notification);
      }
      
      // Programar notificaciones nocturnas (22:00-06:00, 3 veces)
      // 22:00, 00:00, 04:00 = 3 notificaciones
      const nightHours = [22, 0, 4];
      
      for (const hour of nightHours) {
        const scheduledTime = new Date(now);
        scheduledTime.setHours(hour, 0, 0, 0);
        
        // Si la hora ya pasó hoy, programar para mañana
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const notification: Notification = {
          id: `postural-night-${patientId}-${hour}`,
          patientId,
          type: NotificationType.POSTURAL_CHANGE,
          priority: Priority.MEDIUM,
          message: `Cambio postural nocturno - ${hour}:00`,
          scheduledTime,
          isDualAlert: false,
          status: 'SCHEDULED' as any,
          reminderSent: false,
          createdAt: now,
        };
        
        await notificationService.scheduleNotification(notification);
      }
      
      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_NOTIFICATION_FAILED,
        message: 'Error al programar cambios posturales',
        details: error,
      });
    }
  }

  /**
   * Registra un cambio postural realizado
   * 
   * @param posturalChange - Datos del cambio postural
   * @returns Result con void o error
   */
  async recordPosturalChange(posturalChange: PosturalChange): Promise<Result<void>> {
    try {
      // Validar campos requeridos
      const validationService = getValidationService();
      
      const patientIdValidation = validationService.validateRequiredField(
        posturalChange.patientId,
        'patientId'
      );
      if (!patientIdValidation.isValid) {
        return Err({
          code: patientIdValidation.errorCode!,
          message: patientIdValidation.message!,
        });
      }
      
      const positionValidation = validationService.validateRequiredField(
        posturalChange.position,
        'position'
      );
      if (!positionValidation.isValid) {
        return Err({
          code: positionValidation.errorCode!,
          message: positionValidation.message!,
        });
      }
      
      // Validar elevación de cama si está presente
      if (posturalChange.bedElevation !== undefined) {
        const elevationValidation = validationService.validateBedElevation(
          posturalChange.bedElevation
        );
        if (!elevationValidation.isValid) {
          return Err({
            code: elevationValidation.errorCode!,
            message: elevationValidation.message!,
          });
        }
      }
      
      // Asegurar que tenga timestamp
      if (!posturalChange.performedAt) {
        posturalChange.performedAt = new Date();
      }
      
      if (!posturalChange.createdAt) {
        posturalChange.createdAt = new Date();
      }
      
      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.POSTURAL_CHANGES, posturalChange);
      
      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al registrar cambio postural',
        details: error,
      });
    }
  }

  /**
   * Registra la elevación de cama con validación
   * 
   * @param patientId - ID del paciente
   * @param degrees - Grados de elevación
   * @param performedBy - Quién realizó el cambio
   * @param notes - Notas adicionales
   * @returns Result con ValidationResult o error
   */
  async recordBedElevation(
    patientId: string,
    degrees: number,
    performedBy: string,
    notes: string = ''
  ): Promise<Result<void>> {
    try {
      const validationService = getValidationService();
      
      // Validar elevación
      const validation = validationService.validateBedElevation(degrees);
      if (!validation.isValid) {
        return Err({
          code: validation.errorCode!,
          message: validation.message!,
        });
      }
      
      // Crear registro de cambio postural con elevación
      const posturalChange: PosturalChange = {
        id: `bed-elevation-${patientId}-${Date.now()}`,
        patientId,
        position: Position.SUPINE, // Asumimos posición supina para elevación de cama
        bedElevation: degrees,
        performedAt: new Date(),
        performedBy,
        notes,
        createdAt: new Date(),
      };
      
      return await this.recordPosturalChange(posturalChange);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al registrar elevación de cama',
        details: error,
      });
    }
  }

  /**
   * Registra una úlcera por presión con clasificación
   * 
   * @param ulcer - Datos de la úlcera
   * @param photo - Fotografía opcional
   * @returns Result con void o error
   */
  async recordPressureUlcer(
    ulcer: PressureUlcer,
    photo?: Photo
  ): Promise<Result<void>> {
    try {
      const validationService = getValidationService();
      
      // Validar campos requeridos
      const patientIdValidation = validationService.validateRequiredField(
        ulcer.patientId,
        'patientId'
      );
      if (!patientIdValidation.isValid) {
        return Err({
          code: patientIdValidation.errorCode!,
          message: patientIdValidation.message!,
        });
      }
      
      const gradeValidation = validationService.validateRequiredField(
        ulcer.grade,
        'grade'
      );
      if (!gradeValidation.isValid) {
        return Err({
          code: gradeValidation.errorCode!,
          message: gradeValidation.message!,
        });
      }
      
      const locationValidation = validationService.validateRequiredField(
        ulcer.location,
        'location'
      );
      if (!locationValidation.isValid) {
        return Err({
          code: locationValidation.errorCode!,
          message: locationValidation.message!,
        });
      }
      
      // Agregar foto si se proporciona
      if (photo) {
        // Asegurar que la foto tenga timestamp
        if (!photo.capturedAt) {
          photo.capturedAt = new Date();
        }
        
        if (!ulcer.photos) {
          ulcer.photos = [];
        }
        ulcer.photos.push(photo);
      }
      
      // Asegurar timestamps
      if (!ulcer.assessedAt) {
        ulcer.assessedAt = new Date();
      }
      
      if (!ulcer.createdAt) {
        ulcer.createdAt = new Date();
      }
      
      ulcer.updatedAt = new Date();
      
      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.PRESSURE_ULCERS, ulcer);
      
      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al registrar úlcera por presión',
        details: error,
      });
    }
  }

  /**
   * Carga una fotografía para una úlcera existente
   * 
   * @param ulcerId - ID de la úlcera
   * @param photo - Fotografía a cargar
   * @returns Result con void o error
   */
  async uploadPhoto(ulcerId: string, photo: Photo): Promise<Result<void>> {
    try {
      // Recuperar úlcera existente
      const ulcer = await IndexedDBUtils.getById<PressureUlcer>(
        IndexedDBUtils.STORES.PRESSURE_ULCERS,
        ulcerId
      );
      
      if (!ulcer) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'Úlcera no encontrada',
        });
      }
      
      // Asegurar que la foto tenga timestamp
      if (!photo.capturedAt) {
        photo.capturedAt = new Date();
      }
      
      // Agregar foto
      if (!ulcer.photos) {
        ulcer.photos = [];
      }
      ulcer.photos.push(photo);
      ulcer.updatedAt = new Date();
      
      // Actualizar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.PRESSURE_ULCERS, ulcer);
      
      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al cargar fotografía',
        details: error,
      });
    }
  }

  /**
   * Obtiene todos los cambios posturales de un paciente
   * 
   * @param patientId - ID del paciente
   * @returns Lista de cambios posturales
   */
  async getPosturalChanges(patientId: string): Promise<PosturalChange[]> {
    try {
      const allChanges = await IndexedDBUtils.getAll<PosturalChange>(
        IndexedDBUtils.STORES.POSTURAL_CHANGES
      );
      
      return allChanges
        .filter((change) => change.patientId === patientId)
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
    } catch (error) {
      console.error('Error al obtener cambios posturales:', error);
      return [];
    }
  }

  /**
   * Obtiene todas las úlceras por presión de un paciente
   * 
   * @param patientId - ID del paciente
   * @returns Lista de úlceras
   */
  async getPressureUlcers(patientId: string): Promise<PressureUlcer[]> {
    try {
      const allUlcers = await IndexedDBUtils.getAll<PressureUlcer>(
        IndexedDBUtils.STORES.PRESSURE_ULCERS
      );
      
      return allUlcers
        .filter((ulcer) => ulcer.patientId === patientId)
        .sort((a, b) => b.assessedAt.getTime() - a.assessedAt.getTime());
    } catch (error) {
      console.error('Error al obtener úlceras por presión:', error);
      return [];
    }
  }
}

// Instancia singleton del servicio
let skinIntegrityManagerInstance: SkinIntegrityManager | null = null;

/**
 * Obtiene la instancia singleton del SkinIntegrityManager
 */
export function getSkinIntegrityManager(): SkinIntegrityManager {
  if (!skinIntegrityManagerInstance) {
    skinIntegrityManagerInstance = new SkinIntegrityManager();
  }
  return skinIntegrityManagerInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetSkinIntegrityManager(): void {
  skinIntegrityManagerInstance = null;
}
