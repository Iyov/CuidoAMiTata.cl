/**
 * Bitácora Service
 * Servicio para operaciones CRUD de bitácora diaria en Supabase
 */

import { supabase } from '../config/supabase';
import type { Result } from '../types/result';
import { Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type { BitacoraEntry, BitacoraEntryInput } from '../types/models';

/**
 * Interfaz del servicio de bitácora
 */
export interface IBitacoraService {
  save(entry: BitacoraEntryInput): Promise<Result<BitacoraEntry>>;
  findByPatientAndDate(patientId: string, date: Date): Promise<Result<BitacoraEntry[]>>;
  findByPatientAndDateRange(patientId: string, start: Date, end: Date): Promise<Result<BitacoraEntry[]>>;
  update(id: string, updates: Partial<BitacoraEntryInput>): Promise<Result<BitacoraEntry>>;
}

/**
 * Convierte una fecha a formato YYYY-MM-DD para Supabase
 */
function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un registro de Supabase a BitacoraEntry
 */
function mapDBRowToEntry(row: any): BitacoraEntry {
  return {
    id: row.id,
    patientId: row.patient_id,
    familyId: row.family_id,
    createdBy: row.created_by,
    entryDate: new Date(row.entry_date),
    breakfast: row.breakfast || undefined,
    lunch: row.lunch || undefined,
    dinner: row.dinner || undefined,
    snacks: row.snacks || undefined,
    mood: row.mood || undefined,
    moodNotes: row.mood_notes || undefined,
    activities: row.activities || undefined,
    activityNotes: row.activity_notes || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Implementación del servicio de bitácora usando Supabase
 */
class BitacoraService implements IBitacoraService {
  /**
   * Guarda una nueva entrada de bitácora
   */
  async save(entry: BitacoraEntryInput): Promise<Result<BitacoraEntry>> {
    try {
      // Obtener el usuario actual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return Err({
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: 'Usuario no autenticado',
          details: authError,
        });
      }

      // Obtener la familia del paciente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('family_id')
        .eq('id', entry.patientId)
        .single();

      if (patientError || !patientData) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'Paciente no encontrado',
          details: patientError,
        });
      }

      // Preparar datos para inserción
      const dbEntry = {
        patient_id: entry.patientId,
        family_id: patientData.family_id,
        created_by: user.id,
        entry_date: formatDateForDB(entry.entryDate),
        breakfast: entry.breakfast || null,
        lunch: entry.lunch || null,
        dinner: entry.dinner || null,
        snacks: entry.snacks || null,
        mood: entry.mood || null,
        mood_notes: entry.moodNotes || null,
        activities: entry.activities || null,
        activity_notes: entry.activityNotes || null,
      };

      // Insertar en Supabase
      const { data, error } = await supabase
        .from('bitacora_entries')
        .insert(dbEntry)
        .select()
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al guardar entrada de bitácora',
          details: error,
        });
      }

      return Ok(mapDBRowToEntry(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al guardar bitácora',
        details: error,
      });
    }
  }

  /**
   * Busca entradas de bitácora por paciente y fecha específica
   */
  async findByPatientAndDate(patientId: string, date: Date): Promise<Result<BitacoraEntry[]>> {
    try {
      const dateStr = formatDateForDB(date);

      const { data, error } = await supabase
        .from('bitacora_entries')
        .select('*')
        .eq('patient_id', patientId)
        .eq('entry_date', dateStr)
        .order('created_at', { ascending: false });

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al buscar entradas de bitácora',
          details: error,
        });
      }

      const entries = (data || []).map(mapDBRowToEntry);
      return Ok(entries);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al buscar bitácora',
        details: error,
      });
    }
  }

  /**
   * Busca entradas de bitácora por paciente y rango de fechas
   */
  async findByPatientAndDateRange(
    patientId: string,
    start: Date,
    end: Date
  ): Promise<Result<BitacoraEntry[]>> {
    try {
      const startStr = formatDateForDB(start);
      const endStr = formatDateForDB(end);

      const { data, error } = await supabase
        .from('bitacora_entries')
        .select('*')
        .eq('patient_id', patientId)
        .gte('entry_date', startStr)
        .lte('entry_date', endStr)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al buscar entradas de bitácora',
          details: error,
        });
      }

      const entries = (data || []).map(mapDBRowToEntry);
      return Ok(entries);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al buscar bitácora',
        details: error,
      });
    }
  }

  /**
   * Actualiza una entrada de bitácora existente
   */
  async update(id: string, updates: Partial<BitacoraEntryInput>): Promise<Result<BitacoraEntry>> {
    try {
      // Preparar datos para actualización
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.breakfast !== undefined) dbUpdates.breakfast = updates.breakfast || null;
      if (updates.lunch !== undefined) dbUpdates.lunch = updates.lunch || null;
      if (updates.dinner !== undefined) dbUpdates.dinner = updates.dinner || null;
      if (updates.snacks !== undefined) dbUpdates.snacks = updates.snacks || null;
      if (updates.mood !== undefined) dbUpdates.mood = updates.mood || null;
      if (updates.moodNotes !== undefined) dbUpdates.mood_notes = updates.moodNotes || null;
      if (updates.activities !== undefined) dbUpdates.activities = updates.activities || null;
      if (updates.activityNotes !== undefined) dbUpdates.activity_notes = updates.activityNotes || null;

      // Actualizar en Supabase
      const { data, error } = await supabase
        .from('bitacora_entries')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al actualizar entrada de bitácora',
          details: error,
        });
      }

      if (!data) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'Entrada de bitácora no encontrada',
        });
      }

      return Ok(mapDBRowToEntry(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al actualizar bitácora',
        details: error,
      });
    }
  }
}

// Instancia singleton del servicio
let bitacoraServiceInstance: BitacoraService | null = null;

/**
 * Obtiene la instancia del servicio de bitácora
 */
export function getBitacoraService(): IBitacoraService {
  if (!bitacoraServiceInstance) {
    bitacoraServiceInstance = new BitacoraService();
  }
  return bitacoraServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para testing)
 */
export function resetBitacoraService(): void {
  bitacoraServiceInstance = null;
}
