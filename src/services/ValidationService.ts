/**
 * Validation Service
 * Gestiona validaciones de datos de entrada en múltiples capas
 */

import { ErrorCode } from '../types/enums';

/**
 * Resultado de validación con detalles
 */
export interface ValidationResult {
  isValid: boolean;
  errorCode?: ErrorCode;
  message?: string;
}

/**
 * Servicio de validación para datos de entrada
 */
export class ValidationService {
  /**
   * Valida que la administración de medicamento ocurra dentro de la ventana de adherencia
   * Ventana de adherencia: 3 horas (±1.5 horas del horario programado)
   * 
   * @param scheduledTime - Hora programada para la administración
   * @param actualTime - Hora real de administración
   * @returns true si está dentro de la ventana, false si no
   */
  validateAdherenceWindow(scheduledTime: Date, actualTime: Date): boolean {
    const ADHERENCE_WINDOW_MINUTES = 90; // 1.5 horas = 90 minutos
    
    // Calcular diferencia en minutos
    const diffMilliseconds = Math.abs(actualTime.getTime() - scheduledTime.getTime());
    const diffMinutes = diffMilliseconds / (1000 * 60);
    
    // Verificar si está dentro de la ventana
    return diffMinutes <= ADHERENCE_WINDOW_MINUTES;
  }

  /**
   * Valida que la elevación de cama no exceda el máximo permitido
   * Máximo permitido: 30 grados
   * 
   * @param degrees - Grados de elevación de la cama
   * @returns ValidationResult con resultado y mensaje de error si aplica
   */
  validateBedElevation(degrees: number): ValidationResult {
    const MAX_BED_ELEVATION = 30;
    
    // Validar que sea un número válido
    if (typeof degrees !== 'number' || isNaN(degrees)) {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: 'La elevación debe ser un número válido',
      };
    }
    
    // Validar que no sea negativo
    if (degrees < 0) {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_BED_ELEVATION,
        message: 'La elevación de la cama no puede ser negativa',
      };
    }
    
    // Validar que no exceda el máximo
    if (degrees > MAX_BED_ELEVATION) {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_BED_ELEVATION,
        message: `La elevación de la cama no puede exceder ${MAX_BED_ELEVATION} grados`,
      };
    }
    
    return {
      isValid: true,
    };
  }

  /**
   * Valida que un campo requerido no esté vacío
   * 
   * @param field - Valor del campo a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   * @returns ValidationResult con resultado y mensaje de error si aplica
   */
  validateRequiredField(field: unknown, fieldName: string): ValidationResult {
    // Verificar null o undefined
    if (field === null || field === undefined) {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_REQUIRED_FIELD,
        message: `El campo "${fieldName}" es obligatorio`,
      };
    }
    
    // Verificar strings vacíos
    if (typeof field === 'string' && field.trim() === '') {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_REQUIRED_FIELD,
        message: `El campo "${fieldName}" no puede estar vacío`,
      };
    }
    
    // Verificar arrays vacíos
    if (Array.isArray(field) && field.length === 0) {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_REQUIRED_FIELD,
        message: `El campo "${fieldName}" debe contener al menos un elemento`,
      };
    }
    
    return {
      isValid: true,
    };
  }

  /**
   * Valida que un rango de fechas sea válido
   * La fecha de inicio debe ser anterior o igual a la fecha de fin
   * 
   * @param startDate - Fecha de inicio del rango
   * @param endDate - Fecha de fin del rango
   * @returns ValidationResult con resultado y mensaje de error si aplica
   */
  validateDateRange(startDate: Date, endDate: Date): ValidationResult {
    // Validar que sean fechas válidas
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: 'La fecha de inicio no es válida',
      };
    }
    
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: 'La fecha de fin no es válida',
      };
    }
    
    // Validar que la fecha de inicio sea anterior o igual a la fecha de fin
    if (startDate.getTime() > endDate.getTime()) {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
      };
    }
    
    return {
      isValid: true,
    };
  }

  /**
   * Valida que una justificación tenga contenido significativo
   * Requiere al menos 3 caracteres alfanuméricos o de puntuación significativa
   *
   * @param justification - Texto de justificación a validar
   * @param fieldName - Nombre del campo para el mensaje de error
   * @returns ValidationResult con resultado y mensaje de error si aplica
   */
  validateJustification(justification: unknown, fieldName: string): ValidationResult {
    // Primero validar que no esté vacío
    const requiredValidation = this.validateRequiredField(justification, fieldName);
    if (!requiredValidation.isValid) {
      return requiredValidation;
    }

    // Validar que sea un string
    if (typeof justification !== 'string') {
      return {
        isValid: false,
        errorCode: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: `El campo "${fieldName}" debe ser texto`,
      };
    }

    // Validar longitud mínima después de trim
    const trimmed = justification.trim();
    const MIN_JUSTIFICATION_LENGTH = 3;

    if (trimmed.length < MIN_JUSTIFICATION_LENGTH) {
      return {
        isValid: false,
        errorCode: ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED,
        message: `El campo "${fieldName}" debe contener al menos ${MIN_JUSTIFICATION_LENGTH} caracteres`,
      };
    }

    // Validar que contenga al menos algunos caracteres alfanuméricos o de puntuación significativa
    // Esto evita justificaciones como "!!!" o "   !"
    const hasSignificantContent = /[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ,.\-:;]/.test(trimmed);

    if (!hasSignificantContent) {
      return {
        isValid: false,
        errorCode: ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED,
        message: `El campo "${fieldName}" debe contener texto significativo`,
      };
    }

    return {
      isValid: true,
    };
  }

}

// Instancia singleton del servicio
let validationServiceInstance: ValidationService | null = null;

/**
 * Obtiene la instancia singleton del ValidationService
 */
export function getValidationService(): ValidationService {
  if (!validationServiceInstance) {
    validationServiceInstance = new ValidationService();
  }
  return validationServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetValidationService(): void {
  validationServiceInstance = null;
}
