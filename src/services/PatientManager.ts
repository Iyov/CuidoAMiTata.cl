/**
 * Patient Manager
 * Gestiona perfiles de pacientes y aislamiento de datos
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, Priority, Severity } from '../types/enums';
import type { Patient, RiskAlert, Notification, CareEvent } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

/**
 * Gestor de pacientes con lógica de perfiles múltiples y aislamiento de datos
 */
export class PatientManager {
  private currentPatientId: string | null = null;

  /**
   * Crea un nuevo perfil de paciente
   * 
   * @param patient - Datos del paciente a crear
   * @returns Result con el paciente creado o error
   */
  async createPatientProfile(patient: Patient): Promise<Result<Patient>> {
    try {
      // Validar campos requeridos
      if (!patient.name || patient.name.trim() === '') {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'El nombre del paciente es obligatorio',
        });
      }

      if (!patient.dateOfBirth) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'La fecha de nacimiento es obligatoria',
        });
      }

      // Asegurar que el paciente tenga un ID único
      if (!patient.id) {
        patient.id = `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Inicializar arrays vacíos si no existen
      patient.riskFactors = patient.riskFactors || [];
      patient.medications = patient.medications || [];
      patient.careHistory = patient.careHistory || [];
      patient.preferences = patient.preferences || {};

      // Establecer timestamps
      const now = new Date();
      patient.createdAt = patient.createdAt || now;
      patient.updatedAt = now;

      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.PATIENTS, patient);

      return Ok(patient);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al crear perfil de paciente',
        details: error,
      });
    }
  }

  /**
   * Selecciona un paciente activo y filtra datos para mostrar solo los de ese paciente
   * Implementa aislamiento de datos (Requisito 10.2)
   * 
   * @param patientId - ID del paciente a seleccionar
   * @returns Result con el paciente seleccionado o error
   */
  async selectPatient(patientId: string): Promise<Result<Patient>> {
    try {
      // Buscar el paciente
      const patient = await IndexedDBUtils.getById<Patient>(
        IndexedDBUtils.STORES.PATIENTS,
        patientId
      );

      if (!patient) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: `Paciente con ID ${patientId} no encontrado`,
        });
      }

      // Establecer como paciente actual
      this.currentPatientId = patientId;

      // Guardar en localStorage para persistencia
      localStorage.setItem('currentPatientId', patientId);

      return Ok(patient);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al seleccionar paciente',
        details: error,
      });
    }
  }

  /**
   * Cambia el paciente activo
   * 
   * @param patientId - ID del nuevo paciente activo
   * @returns Result con el paciente seleccionado o error
   */
  async switchPatient(patientId: string): Promise<Result<Patient>> {
    return this.selectPatient(patientId);
  }

  /**
   * Obtiene el ID del paciente actualmente seleccionado
   * 
   * @returns ID del paciente actual o null si no hay ninguno seleccionado
   */
  getCurrentPatientId(): string | null {
    // Intentar recuperar de memoria
    if (this.currentPatientId) {
      return this.currentPatientId;
    }

    // Intentar recuperar de localStorage
    const storedId = localStorage.getItem('currentPatientId');
    if (storedId) {
      this.currentPatientId = storedId;
      return storedId;
    }

    return null;
  }

  /**
   * Obtiene alertas pendientes para un paciente específico
   * Implementa indicadores visuales (Requisito 10.3)
   * 
   * @param patientId - ID del paciente
   * @returns Array de alertas de riesgo para el paciente
   */
  async getPatientAlerts(patientId: string): Promise<RiskAlert[]> {
    try {
      const alerts: RiskAlert[] = [];

      // Obtener el paciente
      const patient = await IndexedDBUtils.getById<Patient>(
        IndexedDBUtils.STORES.PATIENTS,
        patientId
      );

      if (!patient) {
        return [];
      }

      // Generar alertas basadas en factores de riesgo
      for (const riskFactor of patient.riskFactors) {
        const alert: RiskAlert = {
          id: `alert-${patientId}-${riskFactor.type}-${riskFactor.assessedAt.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
          patientId: patientId,
          riskType: riskFactor.type,
          severity: riskFactor.severity,
          message: this.getRiskAlertMessage(riskFactor.type, riskFactor.severity),
          createdAt: new Date(),
        };
        alerts.push(alert);
      }

      // Obtener notificaciones pendientes del paciente
      const allNotifications = await IndexedDBUtils.getByIndex<Notification>(
        IndexedDBUtils.STORES.NOTIFICATIONS,
        'patientId',
        patientId
      );

      // Filtrar notificaciones pendientes o no reconocidas
      const pendingNotifications = allNotifications.filter(
        (n) => n.status === 'SCHEDULED' || n.status === 'SENT'
      );

      // Agregar alertas de notificaciones críticas pendientes
      for (const notification of pendingNotifications) {
        if (notification.priority === Priority.CRITICAL || notification.priority === Priority.HIGH) {
          const alert: RiskAlert = {
            id: `alert-notif-${notification.id}`,
            patientId: patientId,
            riskType: 'MOBILITY_ISSUES' as any, // Tipo genérico para notificaciones
            severity: notification.priority === Priority.CRITICAL ? Severity.HIGH : Severity.MEDIUM,
            message: notification.message,
            createdAt: notification.createdAt,
          };
          alerts.push(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error al obtener alertas del paciente:', error);
      return [];
    }
  }

  /**
   * Obtiene todos los pacientes
   * 
   * @returns Array de todos los pacientes
   */
  async getAllPatients(): Promise<Patient[]> {
    try {
      return await IndexedDBUtils.getAll<Patient>(IndexedDBUtils.STORES.PATIENTS);
    } catch (error) {
      console.error('Error al obtener todos los pacientes:', error);
      return [];
    }
  }

  /**
   * Obtiene un paciente por ID
   * 
   * @param patientId - ID del paciente
   * @returns Paciente o null si no existe
   */
  async getPatientById(patientId: string): Promise<Patient | null> {
    try {
      const patient = await IndexedDBUtils.getById<Patient>(
        IndexedDBUtils.STORES.PATIENTS,
        patientId
      );
      return patient || null;
    } catch (error) {
      console.error('Error al obtener paciente:', error);
      return null;
    }
  }

  /**
   * Actualiza un perfil de paciente
   * 
   * @param patient - Paciente con datos actualizados
   * @returns Result indicando éxito o error
   */
  async updatePatientProfile(patient: Patient): Promise<Result<Patient>> {
    try {
      // Verificar que el paciente existe
      const existing = await IndexedDBUtils.getById<Patient>(
        IndexedDBUtils.STORES.PATIENTS,
        patient.id
      );

      if (!existing) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: `Paciente con ID ${patient.id} no encontrado`,
        });
      }

      // Actualizar timestamp
      patient.updatedAt = new Date();

      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.PATIENTS, patient);

      return Ok(patient);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al actualizar perfil de paciente',
        details: error,
      });
    }
  }

  /**
   * Filtra eventos de cuidado para mostrar solo los del paciente actual
   * Implementa aislamiento de datos (Requisito 10.2, 10.5)
   * 
   * @returns Array de eventos del paciente actual
   */
  async getFilteredCareEvents(): Promise<CareEvent[]> {
    const patientId = this.getCurrentPatientId();
    
    if (!patientId) {
      return [];
    }

    try {
      // Obtener todos los eventos del paciente
      const events = await IndexedDBUtils.getByIndex<CareEvent>(
        IndexedDBUtils.STORES.CARE_EVENTS,
        'patientId',
        patientId
      );

      return events;
    } catch (error) {
      console.error('Error al obtener eventos filtrados:', error);
      return [];
    }
  }

  /**
   * Genera mensaje de alerta basado en tipo y severidad de riesgo
   * 
   * @param riskType - Tipo de factor de riesgo
   * @param severity - Severidad del riesgo
   * @returns Mensaje descriptivo en español
   */
  private getRiskAlertMessage(riskType: string, severity: Severity): string {
    const severityText = severity === 'HIGH' ? 'alto' : severity === 'MEDIUM' ? 'medio' : 'bajo';
    
    switch (riskType) {
      case 'SEDATIVES':
        return `Riesgo ${severityText} de caídas: paciente con sedantes prescritos`;
      case 'COGNITIVE_IMPAIRMENT':
        return `Riesgo ${severityText} de caídas: paciente con deterioro cognitivo`;
      case 'VISION_PROBLEMS':
        return `Riesgo ${severityText} de caídas: paciente con problemas de visión`;
      case 'MOBILITY_ISSUES':
        return `Riesgo ${severityText}: paciente con problemas de movilidad`;
      default:
        return `Alerta de riesgo ${severityText}`;
    }
  }
}

// Instancia singleton del servicio
let patientManagerInstance: PatientManager | null = null;

/**
 * Obtiene la instancia singleton del PatientManager
 */
export function getPatientManager(): PatientManager {
  if (!patientManagerInstance) {
    patientManagerInstance = new PatientManager();
  }
  return patientManagerInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetPatientManager(): void {
  patientManagerInstance = null;
}
