/**
 * Bitácora Manager
 * Capa de lógica de negocio para bitácora diaria
 * Maneja validaciones y reglas de negocio antes de delegar a BitacoraService
 */

import type { Result } from '../types/result';
import { Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type { BitacoraEntry, BitacoraEntryInput } from '../types/models';
import { getBitacoraService, type IBitacoraService } from './BitacoraService';

/**
 * Interfaz del manager de bitácora
 */
export interface IBitacoraManager {
  createEntry(entry: BitacoraEntryInput): Promise<Result<BitacoraEntry>>;
  getEntriesByDate(patientId: string, date: Date): Promise<Result<BitacoraEntry[]>>;
  getEntriesByDateRange(patientId: string, start: Date, end: Date): Promise<Result<BitacoraEntry[]>>;
  updateEntry(id: string, updates: Partial<BitacoraEntryInput>): Promise<Result<BitacoraEntry>>;
  canEdit(entry: BitacoraEntry, userId: string): boolean;
}

/**
 * Valida que la fecha no sea futura
 */
function validateNotFutureDate(date: Date): Result<void> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (entryDate > today) {
    return Err({
      code: ErrorCode.BITACORA_FUTURE_DATE,
      message: 'No se puede crear una entrada para una fecha futura',
    });
  }
  
  return Ok(undefined);
}

/**
 * Valida que al menos un campo esté completo
 */
function validateNotEmpty(entry: BitacoraEntryInput): Result<void> {
  const hasBreakfast = entry.breakfast && entry.breakfast.trim().length > 0;
  const hasLunch = entry.lunch && entry.lunch.trim().length > 0;
  const hasDinner = entry.dinner && entry.dinner.trim().length > 0;
  const hasSnacks = entry.snacks && entry.snacks.trim().length > 0;
  const hasMood = entry.mood !== undefined;
  const hasMoodNotes = entry.moodNotes && entry.moodNotes.trim().length > 0;
  const hasActivities = entry.activities && entry.activities.length > 0;
  const hasActivityNotes = entry.activityNotes && entry.activityNotes.trim().length > 0;
  
  const hasAnyContent = hasBreakfast || hasLunch || hasDinner || hasSnacks || 
                        hasMood || hasMoodNotes || hasActivities || hasActivityNotes;
  
  if (!hasAnyContent) {
    return Err({
      code: ErrorCode.BITACORA_EMPTY_ENTRY,
      message: 'Debe completar al menos un campo de la bitácora',
    });
  }
  
  return Ok(undefined);
}

/**
 * Implementación del manager de bitácora
 */
export class BitacoraManager implements IBitacoraManager {
  private service: IBitacoraService;
  
  constructor(service?: IBitacoraService) {
    this.service = service || getBitacoraService();
  }
  
  /**
   * Crea una nueva entrada de bitácora con validaciones
   */
  async createEntry(entry: BitacoraEntryInput): Promise<Result<BitacoraEntry>> {
    // Validar fecha no futura
    const dateValidation = validateNotFutureDate(entry.entryDate);
    if (!dateValidation.ok) {
      return dateValidation as Result<BitacoraEntry>;
    }
    
    // Validar que no esté vacía
    const emptyValidation = validateNotEmpty(entry);
    if (!emptyValidation.ok) {
      return emptyValidation as Result<BitacoraEntry>;
    }
    
    // Delegar a servicio
    return this.service.save(entry);
  }
  
  /**
   * Obtiene entradas de bitácora por paciente y fecha
   */
  async getEntriesByDate(patientId: string, date: Date): Promise<Result<BitacoraEntry[]>> {
    return this.service.findByPatientAndDate(patientId, date);
  }
  
  /**
   * Obtiene entradas de bitácora por paciente y rango de fechas
   */
  async getEntriesByDateRange(
    patientId: string,
    start: Date,
    end: Date
  ): Promise<Result<BitacoraEntry[]>> {
    return this.service.findByPatientAndDateRange(patientId, start, end);
  }
  
  /**
   * Actualiza una entrada de bitácora con validaciones
   */
  async updateEntry(id: string, updates: Partial<BitacoraEntryInput>): Promise<Result<BitacoraEntry>> {
    // Si se actualiza la fecha, validar que no sea futura
    if (updates.entryDate) {
      const dateValidation = validateNotFutureDate(updates.entryDate);
      if (!dateValidation.ok) {
        return dateValidation as Result<BitacoraEntry>;
      }
    }
    
    // Delegar a servicio
    return this.service.update(id, updates);
  }
  
  /**
   * Verifica si una entrada puede ser editada
   * Solo el creador puede editar dentro de 24 horas
   */
  canEdit(entry: BitacoraEntry, userId: string): boolean {
    // Verificar que sea el creador
    if (entry.createdBy !== userId) {
      return false;
    }
    
    // Verificar ventana de 24 horas
    const now = new Date();
    const createdAt = new Date(entry.createdAt);
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceCreation < 24;
  }
}

// Instancia singleton del manager
let bitacoraManagerInstance: BitacoraManager | null = null;

/**
 * Obtiene la instancia del manager de bitácora
 */
export function getBitacoraManager(): IBitacoraManager {
  if (!bitacoraManagerInstance) {
    bitacoraManagerInstance = new BitacoraManager();
  }
  return bitacoraManagerInstance;
}

/**
 * Resetea la instancia del manager (útil para testing)
 */
export function resetBitacoraManager(): void {
  bitacoraManagerInstance = null;
}
