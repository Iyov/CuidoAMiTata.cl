/**
 * Ethical Care Module
 * Gestiona validación de restricciones y promueve alternativas éticas
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, RestraintType } from '../types/enums';
import type {
  Restraint,
  Strategy,
  CareContext,
  JustificationForm,
} from '../types/models';
import { ValidationResult } from './ValidationService';
import { getValidationService } from './ValidationService';

/**
 * Módulo de cuidado ético con validación de restricciones
 */
export class EthicalCareModule {
  /**
   * Valida una restricción antes de permitir su registro
   * Bloquea restricciones químicas (sedantes para manejo conductual)
   * 
   * @param restraint - Restricción a validar
   * @returns ValidationResult con resultado y mensaje
   */
  validateRestraint(restraint: Restraint): ValidationResult {
    const validationService = getValidationService();

    // Validar campos requeridos
    const justificationValidation = validationService.validateRequiredField(
      restraint.justification,
      'justificación'
    );

    if (!justificationValidation.isValid) {
      return {
        isValid: false,
        errorCode: ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED,
        message: 'Debe proporcionar una justificación documentada para cualquier restricción',
      };
    }

    // Bloqueo duro para restricciones químicas (Requisito 7.1)
    if (restraint.type === RestraintType.CHEMICAL) {
      // Verificar si es para manejo conductual
      const isForBehavioralManagement = this.isChemicalRestraintForBehavior(restraint);

      if (isForBehavioralManagement) {
        return {
          isValid: false,
          errorCode: ErrorCode.BUSINESS_CHEMICAL_RESTRAINT_BLOCKED,
          message:
            'No se pueden usar sedantes para manejo conductual. Consulte las estrategias alternativas.',
        };
      }
    }

    // Validar que se hayan considerado alternativas
    if (!restraint.alternatives || restraint.alternatives.length === 0) {
      return {
        isValid: false,
        errorCode: ErrorCode.BUSINESS_JUSTIFICATION_REQUIRED,
        message: 'Debe documentar las estrategias alternativas consideradas',
      };
    }

    return {
      isValid: true,
    };
  }

  /**
   * Clasifica el tipo de restricción
   * 
   * @param restraint - Restricción a clasificar
   * @returns Tipo de restricción clasificado
   */
  classifyRestraint(restraint: Restraint): RestraintType {
    // Si ya tiene tipo asignado, verificar clasificación
    if (restraint.type) {
      return restraint.type;
    }

    // Clasificación automática basada en el tipo específico
    const specificTypeLower = restraint.specificType.toLowerCase();

    // Restricciones químicas: sedantes, tranquilizantes
    if (
      specificTypeLower.includes('sedante') ||
      specificTypeLower.includes('tranquilizante') ||
      specificTypeLower.includes('antipsicótico') ||
      specificTypeLower.includes('benzodiacepina')
    ) {
      return RestraintType.CHEMICAL;
    }

    // Restricciones mecánicas: barandillas, cinturones, sujeciones
    if (
      specificTypeLower.includes('barandilla') ||
      specificTypeLower.includes('cinturón') ||
      specificTypeLower.includes('sujeción') ||
      specificTypeLower.includes('correa') ||
      specificTypeLower.includes('chaleco')
    ) {
      return RestraintType.MECHANICAL;
    }

    // Restricciones ambientales: puertas cerradas, alarmas
    if (
      specificTypeLower.includes('puerta') ||
      specificTypeLower.includes('alarma') ||
      specificTypeLower.includes('sensor') ||
      specificTypeLower.includes('cerradura')
    ) {
      return RestraintType.ENVIRONMENTAL;
    }

    // Por defecto, clasificar como mecánica si no se puede determinar
    return RestraintType.MECHANICAL;
  }

  /**
   * Obtiene estrategias alternativas a las restricciones
   * 
   * @param context - Contexto de cuidado del paciente
   * @returns Array de estrategias alternativas
   */
  getAlternativeStrategies(context: CareContext): Strategy[] {
    const strategies: Strategy[] = [];

    // Estrategias de distracción
    strategies.push({
      id: 'distraction-1',
      category: 'DISTRACTION',
      title: 'Actividades recreativas',
      description: 'Proporcionar actividades que mantengan al paciente ocupado y estimulado',
      examples: [
        'Música relajante o favorita del paciente',
        'Álbumes de fotos familiares',
        'Actividades manuales simples (doblar toallas, clasificar objetos)',
        'Televisión o radio con programas de interés',
      ],
    });

    strategies.push({
      id: 'distraction-2',
      category: 'DISTRACTION',
      title: 'Compañía y supervisión',
      description: 'Aumentar la presencia y atención del cuidador',
      examples: [
        'Aumentar frecuencia de visitas y comprobaciones',
        'Sentar al paciente cerca del área de actividad del cuidador',
        'Involucrar a familiares en el cuidado',
        'Considerar acompañante o voluntario',
      ],
    });

    // Estrategias de comunicación
    strategies.push({
      id: 'communication-1',
      category: 'COMMUNICATION',
      title: 'Técnicas de comunicación terapéutica',
      description: 'Usar comunicación efectiva para reducir ansiedad y agitación',
      examples: [
        'Hablar con tono calmado y tranquilizador',
        'Mantener contacto visual y lenguaje corporal abierto',
        'Validar emociones del paciente',
        'Usar frases cortas y simples',
        'Evitar confrontación o corrección directa',
      ],
    });

    strategies.push({
      id: 'communication-2',
      category: 'COMMUNICATION',
      title: 'Orientación a la realidad',
      description: 'Ayudar al paciente a mantenerse orientado',
      examples: [
        'Relojes y calendarios visibles',
        'Recordatorios verbales suaves de lugar y tiempo',
        'Rutinas predecibles y consistentes',
        'Señalización clara en el hogar',
      ],
    });

    // Estrategias de modificación ambiental
    strategies.push({
      id: 'environmental-1',
      category: 'ENVIRONMENTAL',
      title: 'Optimización del entorno',
      description: 'Modificar el ambiente para promover seguridad y comodidad',
      examples: [
        'Iluminación adecuada (evitar sombras y deslumbramiento)',
        'Reducir ruido y estímulos excesivos',
        'Temperatura confortable',
        'Acceso fácil al baño',
        'Eliminar objetos peligrosos del alcance',
      ],
    });

    strategies.push({
      id: 'environmental-2',
      category: 'ENVIRONMENTAL',
      title: 'Adaptaciones de seguridad',
      description: 'Implementar medidas de seguridad no restrictivas',
      examples: [
        'Cama baja o colchón en el suelo',
        'Alfombras antideslizantes',
        'Barandillas parciales (no envolventes)',
        'Sensores de movimiento para alertar al cuidador',
        'Espacios seguros para deambular',
      ],
    });

    // Estrategias de atención a necesidades básicas
    strategies.push({
      id: 'needs-1',
      category: 'COMMUNICATION',
      title: 'Atención a necesidades no expresadas',
      description: 'Identificar y atender necesidades que pueden causar agitación',
      examples: [
        'Verificar dolor y proporcionar analgesia adecuada',
        'Asegurar hidratación y nutrición',
        'Programar visitas regulares al baño',
        'Verificar comodidad (ropa, temperatura, posición)',
        'Evaluar efectos secundarios de medicamentos',
      ],
    });

    return strategies;
  }

  /**
   * Requiere justificación documentada para una restricción
   * 
   * @param restraint - Restricción que requiere justificación
   * @returns Formulario de justificación a completar
   */
  requireJustification(restraint: Restraint): JustificationForm {
    return {
      restraintId: restraint.id,
      justification: restraint.justification || '',
      alternatives: restraint.alternatives || [],
      authorizedBy: restraint.authorizedBy || '',
      timestamp: new Date(),
    };
  }

  /**
   * Determina si una restricción química es para manejo conductual
   * 
   * @param restraint - Restricción a evaluar
   * @returns true si es para manejo conductual, false si es para indicación médica
   */
  private isChemicalRestraintForBehavior(restraint: Restraint): boolean {
    const justificationLower = restraint.justification.toLowerCase();
    const specificTypeLower = restraint.specificType.toLowerCase();

    // Palabras clave que indican manejo conductual (bloqueado)
    const behavioralKeywords = [
      'agitación',
      'agitado',
      'inquieto',
      'deambulación',
      'deambular',
      'comportamiento',
      'conducta',
      'agresivo',
      'agresividad',
      'confusión',
      'confuso',
      'desorientado',
      'desorientación',
      'intranquilo',
      'nervioso',
      'ansioso',
      'no coopera',
      'resistencia',
    ];

    // Palabras clave que indican indicación médica válida (permitido)
    const medicalKeywords = [
      'ansiedad clínica',
      'trastorno de ansiedad',
      'insomnio',
      'convulsiones',
      'epilepsia',
      'procedimiento médico',
      'cirugía',
      'anestesia',
      'dolor severo',
      'abstinencia',
      'delirium tremens',
    ];

    // Verificar si hay indicación médica válida
    const hasMedicalIndication = medicalKeywords.some(
      (keyword) =>
        justificationLower.includes(keyword) || specificTypeLower.includes(keyword)
    );

    if (hasMedicalIndication) {
      return false; // Es para indicación médica, permitido
    }

    // Verificar si es para manejo conductual
    const isBehavioral = behavioralKeywords.some(
      (keyword) =>
        justificationLower.includes(keyword) || specificTypeLower.includes(keyword)
    );

    // Si no hay indicación médica clara y hay palabras de comportamiento, bloquear
    return isBehavioral;
  }
}

// Instancia singleton del servicio
let ethicalCareModuleInstance: EthicalCareModule | null = null;

/**
 * Obtiene la instancia singleton del EthicalCareModule
 */
export function getEthicalCareModule(): EthicalCareModule {
  if (!ethicalCareModuleInstance) {
    ethicalCareModuleInstance = new EthicalCareModule();
  }
  return ethicalCareModuleInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetEthicalCareModule(): void {
  ethicalCareModuleInstance = null;
}
