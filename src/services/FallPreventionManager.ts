/**
 * Fall Prevention Manager
 * Gestiona evaluación de riesgos y registro de incidentes de caídas
 * 
 * TODO: Implementar filtrado por familia cuando se migre a Supabase
 * Actualmente usa IndexedDB local. Para soporte multi-familiar completo,
 * se necesita migrar a Supabase con políticas RLS.
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, RiskFactorType, Severity, NotificationType, Priority } from '../types/enums';
import type {
  FallIncident,
  RiskChecklist,
  RiskAlert,
  RiskScore,
  Patient,
} from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';
import { getValidationService } from './ValidationService';
import { getNotificationService } from './NotificationService';

/**
 * Gestor de prevención de caídas con evaluación de riesgos
 */
export class FallPreventionManager {
  private validationService = getValidationService();

  /**
   * Envía una lista de verificación diaria de riesgos
   * Requisitos: 2.1, 2.2
   * 
   * @param checklist - Lista de verificación de riesgos
   * @returns Result indicando éxito o error
   */
  async submitDailyChecklist(checklist: RiskChecklist): Promise<Result<void>> {
    try {
      // Validar campos requeridos
      const idValidation = this.validationService.validateRequiredField(checklist.id, 'id');
      if (!idValidation.isValid) {
        return Err({
          code: idValidation.errorCode!,
          message: idValidation.message!,
        });
      }

      const patientIdValidation = this.validationService.validateRequiredField(
        checklist.patientId,
        'patientId'
      );
      if (!patientIdValidation.isValid) {
        return Err({
          code: patientIdValidation.errorCode!,
          message: patientIdValidation.message!,
        });
      }

      const completedByValidation = this.validationService.validateRequiredField(
        checklist.completedBy,
        'completedBy'
      );
      if (!completedByValidation.isValid) {
        return Err({
          code: completedByValidation.errorCode!,
          message: completedByValidation.message!,
        });
      }

      // Validar que tenga fecha
      if (!checklist.checkDate || !(checklist.checkDate instanceof Date)) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'La fecha de verificación es obligatoria',
        });
      }

      // Validar que tenga los campos de evaluación
      if (!checklist.lighting || !checklist.flooring || !checklist.footwear) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'Todos los campos de evaluación son obligatorios (iluminación, suelos, calzado)',
        });
      }

      // Establecer timestamp de creación
      checklist.createdAt = new Date();

      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.RISK_CHECKLISTS, checklist);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al guardar la lista de verificación',
        details: error,
      });
    }
  }

  /**
   * Registra un incidente de caída con validación de "tiempo en el suelo"
   * Requisitos: 2.2, 2.3
   * 
   * @param incident - Incidente de caída a registrar
   * @returns Result indicando éxito o error
   */
  async recordFallIncident(incident: FallIncident): Promise<Result<void>> {
    try {
      // Validar campos requeridos
      const idValidation = this.validationService.validateRequiredField(incident.id, 'id');
      if (!idValidation.isValid) {
        return Err({
          code: idValidation.errorCode!,
          message: idValidation.message!,
        });
      }

      const patientIdValidation = this.validationService.validateRequiredField(
        incident.patientId,
        'patientId'
      );
      if (!patientIdValidation.isValid) {
        return Err({
          code: patientIdValidation.errorCode!,
          message: patientIdValidation.message!,
        });
      }

      // CRÍTICO: Validar campo obligatorio "tiempo en el suelo"
      // Requisito 2.3: Campo obligatorio de tiempo en el suelo
      const timeOnFloorValidation = this.validationService.validateRequiredField(
        incident.timeOnFloor,
        'tiempo en el suelo'
      );
      if (!timeOnFloorValidation.isValid) {
        return Err({
          code: timeOnFloorValidation.errorCode!,
          message: timeOnFloorValidation.message!,
        });
      }

      // Validar que timeOnFloor sea un número válido y no negativo
      if (
        typeof incident.timeOnFloor !== 'number' ||
        isNaN(incident.timeOnFloor) ||
        incident.timeOnFloor < 0
      ) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'El tiempo en el suelo debe ser un número válido mayor o igual a cero',
        });
      }

      const reportedByValidation = this.validationService.validateRequiredField(
        incident.reportedBy,
        'reportedBy'
      );
      if (!reportedByValidation.isValid) {
        return Err({
          code: reportedByValidation.errorCode!,
          message: reportedByValidation.message!,
        });
      }

      // Validar que tenga fecha de ocurrencia
      if (!incident.occurredAt || !(incident.occurredAt instanceof Date)) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'La fecha de ocurrencia es obligatoria',
        });
      }

      // Establecer timestamp de creación
      incident.createdAt = new Date();

      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.FALL_INCIDENTS, incident);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al registrar el incidente de caída',
        details: error,
      });
    }
  }

  /**
   * Obtiene alertas de riesgo basadas en factores de riesgo del paciente
   * Requisitos: 2.4, 2.5, 2.6
   * 
   * @param patient - Paciente para evaluar
   * @returns Array de alertas de riesgo
   */
  async getRiskAlerts(patient: Patient): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];

    // Verificar cada factor de riesgo
    for (const riskFactor of patient.riskFactors) {
      let message = '';
      let shouldAlert = false;

      switch (riskFactor.type) {
        case RiskFactorType.SEDATIVES:
          // Requisito 2.4: Alerta de riesgo elevado por sedantes
          message = 'Riesgo elevado de caídas: Paciente con sedantes prescritos';
          shouldAlert = true;
          break;

        case RiskFactorType.COGNITIVE_IMPAIRMENT:
          // Requisito 2.5: Alerta de riesgo elevado por deterioro cognitivo
          message = 'Riesgo elevado de caídas: Paciente con deterioro cognitivo';
          shouldAlert = true;
          break;

        case RiskFactorType.VISION_PROBLEMS:
          // Requisito 2.6: Alerta de riesgo elevado por problemas de visión
          message = 'Riesgo elevado de caídas: Paciente con problemas de visión';
          shouldAlert = true;
          break;

        case RiskFactorType.MOBILITY_ISSUES:
          message = 'Riesgo elevado de caídas: Paciente con problemas de movilidad';
          shouldAlert = true;
          break;

        default:
          break;
      }

      if (shouldAlert) {
        const alert: RiskAlert = {
          id: `alert-${patient.id}-${riskFactor.type}-${Date.now()}`,
          patientId: patient.id,
          riskType: riskFactor.type,
          severity: riskFactor.severity,
          message,
          createdAt: new Date(),
        };

        alerts.push(alert);

        // Guardar alerta en IndexedDB
        await IndexedDBUtils.put(IndexedDBUtils.STORES.RISK_ALERTS, alert);
      }
    }

    return alerts;
  }

  /**
   * Calcula la puntuación de riesgo agregada del paciente
   * 
   * @param patient - Paciente para evaluar
   * @returns Puntuación de riesgo con desglose por factores
   */
  calculateRiskScore(patient: Patient): RiskScore {
    let totalScore = 0;
    const factors: Array<{ type: RiskFactorType; score: number }> = [];

    // Calcular puntuación por cada factor de riesgo
    for (const riskFactor of patient.riskFactors) {
      let score = 0;

      // Asignar puntuación base según tipo de factor
      switch (riskFactor.type) {
        case RiskFactorType.SEDATIVES:
          score = 30; // Alto riesgo
          break;
        case RiskFactorType.COGNITIVE_IMPAIRMENT:
          score = 25; // Alto riesgo
          break;
        case RiskFactorType.VISION_PROBLEMS:
          score = 20; // Riesgo medio-alto
          break;
        case RiskFactorType.MOBILITY_ISSUES:
          score = 25; // Alto riesgo
          break;
        default:
          score = 10;
      }

      // Ajustar por severidad
      switch (riskFactor.severity) {
        case Severity.HIGH:
          score *= 1.5;
          break;
        case Severity.MEDIUM:
          score *= 1.0;
          break;
        case Severity.LOW:
          score *= 0.5;
          break;
      }

      totalScore += score;
      factors.push({
        type: riskFactor.type,
        score,
      });
    }

    // Determinar nivel de riesgo general
    let level: Severity;
    if (totalScore >= 50) {
      level = Severity.HIGH;
    } else if (totalScore >= 25) {
      level = Severity.MEDIUM;
    } else {
      level = Severity.LOW;
    }

    return {
      total: totalScore,
      factors,
      level,
    };
  }
}

// Instancia singleton del servicio
let fallPreventionManagerInstance: FallPreventionManager | null = null;

/**
 * Obtiene la instancia singleton del FallPreventionManager
 */
export function getFallPreventionManager(): FallPreventionManager {
  if (!fallPreventionManagerInstance) {
    fallPreventionManagerInstance = new FallPreventionManager();
  }
  return fallPreventionManagerInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetFallPreventionManager(): void {
  fallPreventionManagerInstance = null;
}
