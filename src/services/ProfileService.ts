/**
 * Profile Service
 * Servicio para gestión de perfiles de usuario en Supabase
 */

import { supabase } from '../config/supabase';
import type { Result } from '../types/result';
import { Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type { FamilyRole } from '../types/models';

/**
 * Perfil de usuario
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input para crear perfil
 */
export interface CreateProfileInput {
  id: string; // ID del usuario de Supabase Auth
  email: string;
  name: string;
  phone?: string;
}

/**
 * Interfaz del servicio de perfiles
 */
export interface IProfileService {
  createProfile(input: CreateProfileInput): Promise<Result<UserProfile>>;
  getProfile(userId: string): Promise<Result<UserProfile>>;
  updateProfile(userId: string, updates: Partial<CreateProfileInput>): Promise<Result<UserProfile>>;
  updateFamilyAssociation(userId: string, familyId: string): Promise<Result<void>>;
  getUserRole(userId: string, familyId: string): Promise<Result<FamilyRole>>;
}

/**
 * Convierte un registro de Supabase a UserProfile
 */
function mapDBRowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Implementación del servicio de perfiles usando Supabase
 */
class ProfileService implements IProfileService {
  /**
   * Crea un nuevo perfil de usuario
   */
  async createProfile(input: CreateProfileInput): Promise<Result<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: input.id,
          email: input.email,
          name: input.name,
          phone: input.phone,
        })
        .select()
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al crear perfil',
          details: error,
        });
      }

      return Ok(mapDBRowToProfile(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al crear perfil',
        details: error,
      });
    }
  }

  /**
   * Obtiene un perfil por ID de usuario
   */
  async getProfile(userId: string): Promise<Result<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al obtener perfil',
          details: error,
        });
      }

      if (!data) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'Perfil no encontrado',
        });
      }

      return Ok(mapDBRowToProfile(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al obtener perfil',
        details: error,
      });
    }
  }

  /**
   * Actualiza un perfil de usuario
   */
  async updateProfile(userId: string, updates: Partial<CreateProfileInput>): Promise<Result<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al actualizar perfil',
          details: error,
        });
      }

      if (!data) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'Perfil no encontrado',
        });
      }

      return Ok(mapDBRowToProfile(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al actualizar perfil',
        details: error,
      });
    }
  }

  /**
   * Actualiza la asociación de familia de un usuario
   * Nota: Esta función es un placeholder ya que la asociación se maneja en family_members
   */
  async updateFamilyAssociation(userId: string, familyId: string): Promise<Result<void>> {
    // La asociación familia-usuario se maneja en la tabla family_members
    // Esta función existe para cumplir con la interfaz pero no hace nada
    // ya que FamilyService.addFamilyMember maneja esta lógica
    return Ok(undefined);
  }

  /**
   * Obtiene el rol de un usuario en una familia
   */
  async getUserRole(userId: string, familyId: string): Promise<Result<FamilyRole>> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('role')
        .eq('user_id', userId)
        .eq('family_id', familyId)
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al obtener rol del usuario',
          details: error,
        });
      }

      if (!data) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'Usuario no es miembro de esta familia',
        });
      }

      return Ok(data.role as FamilyRole);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al obtener rol',
        details: error,
      });
    }
  }
}

// Instancia singleton del servicio
let profileServiceInstance: ProfileService | null = null;

/**
 * Obtiene la instancia del servicio de perfiles
 */
export function getProfileService(): IProfileService {
  if (!profileServiceInstance) {
    profileServiceInstance = new ProfileService();
  }
  return profileServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para testing)
 */
export function resetProfileService(): void {
  profileServiceInstance = null;
}

export { ProfileService };
