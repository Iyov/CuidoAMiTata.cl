/**
 * Family Service
 * Servicio para operaciones CRUD de familias, miembros e invitaciones en Supabase
 */

import { supabase } from '../config/supabase';
import type { Result } from '../types/result';
import { Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type { Family, FamilyMember, Invitation, FamilyRole } from '../types/models';

/**
 * Interfaz del servicio de familia
 */
export interface IFamilyService {
  // Operaciones de Family
  createFamily(name: string, createdBy: string): Promise<Result<Family>>;
  getFamily(familyId: string): Promise<Result<Family>>;
  updateFamily(familyId: string, name: string): Promise<Result<Family>>;
  deleteFamily(familyId: string): Promise<Result<void>>;
  getUserFamilies(userId: string): Promise<Result<Family[]>>;

  // Operaciones de FamilyMember
  addFamilyMember(familyId: string, userId: string, role: FamilyRole): Promise<Result<FamilyMember>>;
  getFamilyMembers(familyId: string): Promise<Result<FamilyMember[]>>;
  updateMemberRole(familyId: string, userId: string, role: FamilyRole): Promise<Result<FamilyMember>>;
  removeFamilyMember(familyId: string, userId: string): Promise<Result<void>>;
  getMemberRole(familyId: string, userId: string): Promise<Result<FamilyRole>>;

  // Operaciones de Invitation
  createInvitation(familyId: string, email: string, role: FamilyRole, invitedBy: string): Promise<Result<Invitation>>;
  getInvitation(invitationId: string): Promise<Result<Invitation>>;
  getInvitationByToken(token: string): Promise<Result<Invitation>>;
  getFamilyInvitations(familyId: string): Promise<Result<Invitation[]>>;
  acceptInvitation(invitationId: string, userId: string): Promise<Result<void>>;
  cancelInvitation(invitationId: string): Promise<Result<void>>;
}

/**
 * Convierte un registro de Supabase a Family
 */
function mapDBRowToFamily(row: any): Family {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Convierte un registro de Supabase a FamilyMember
 */
function mapDBRowToFamilyMember(row: any): FamilyMember {
  return {
    id: row.id,
    familyId: row.family_id,
    userId: row.user_id,
    userEmail: row.profiles?.email || '',
    userName: row.profiles?.name || '',
    role: row.role as FamilyRole,
    joinedAt: new Date(row.joined_at),
  };
}

/**
 * Convierte un registro de Supabase a Invitation
 */
function mapDBRowToInvitation(row: any): Invitation {
  return {
    id: row.id,
    familyId: row.family_id,
    email: row.email,
    role: row.role as FamilyRole,
    invitedBy: row.invited_by,
    token: row.token,
    status: row.status,
    expiresAt: new Date(row.expires_at),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Genera un token único para invitación
 */
function generateInvitationToken(): string {
  return crypto.randomUUID();
}

/**
 * Implementación del servicio de familia usando Supabase
 */
class FamilyService implements IFamilyService {
  // ==================== OPERACIONES DE FAMILY ====================

  /**
   * Crea una nueva familia
   */
  async createFamily(name: string, createdBy: string): Promise<Result<Family>> {
    try {
      const { data, error } = await supabase
        .from('families')
        .insert({
          name,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al crear familia',
          details: error,
        });
      }

      return Ok(mapDBRowToFamily(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al crear familia',
        details: error,
      });
    }
  }

  /**
   * Obtiene una familia por ID
   */
  async getFamily(familyId: string): Promise<Result<Family>> {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al obtener familia',
          details: error,
        });
      }

      if (!data) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'Familia no encontrada',
        });
      }

      return Ok(mapDBRowToFamily(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al obtener familia',
        details: error,
      });
    }
  }

  /**
   * Actualiza el nombre de una familia
   */
  async updateFamily(familyId: string, name: string): Promise<Result<Family>> {
    try {
      const { data, error } = await supabase
        .from('families')
        .update({
          name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', familyId)
        .select()
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al actualizar familia',
          details: error,
        });
      }

      if (!data) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'Familia no encontrada',
        });
      }

      return Ok(mapDBRowToFamily(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al actualizar familia',
        details: error,
      });
    }
  }

  /**
   * Elimina una familia
   */
  async deleteFamily(familyId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId);

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al eliminar familia',
          details: error,
        });
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al eliminar familia',
        details: error,
      });
    }
  }

  /**
   * Obtiene todas las familias de un usuario
   */
  async getUserFamilies(userId: string): Promise<Result<Family[]>> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('families(*)')
        .eq('user_id', userId);

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al obtener familias del usuario',
          details: error,
        });
      }

      const families = (data || [])
        .map((row: any) => row.families)
        .filter((family: any) => family !== null)
        .map(mapDBRowToFamily);

      return Ok(families);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al obtener familias',
        details: error,
      });
    }
  }

  // ==================== OPERACIONES DE FAMILY_MEMBER ====================

  /**
   * Agrega un miembro a una familia
   */
  async addFamilyMember(familyId: string, userId: string, role: FamilyRole): Promise<Result<FamilyMember>> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          user_id: userId,
          role,
        })
        .select('*, profiles(email, name)')
        .single();

      if (error) {
        // Verificar si es error de duplicado
        if (error.code === '23505') {
          return Err({
            code: ErrorCode.FAMILY_MEMBER_EXISTS,
            message: 'Este usuario ya es miembro de la familia',
            details: error,
          });
        }

        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al agregar miembro a la familia',
          details: error,
        });
      }

      return Ok(mapDBRowToFamilyMember(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al agregar miembro',
        details: error,
      });
    }
  }

  /**
   * Obtiene todos los miembros de una familia
   */
  async getFamilyMembers(familyId: string): Promise<Result<FamilyMember[]>> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, profiles(email, name)')
        .eq('family_id', familyId)
        .order('joined_at', { ascending: true });

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al obtener miembros de la familia',
          details: error,
        });
      }

      const members = (data || []).map(mapDBRowToFamilyMember);
      return Ok(members);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al obtener miembros',
        details: error,
      });
    }
  }

  /**
   * Actualiza el rol de un miembro
   */
  async updateMemberRole(familyId: string, userId: string, role: FamilyRole): Promise<Result<FamilyMember>> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .update({ role })
        .eq('family_id', familyId)
        .eq('user_id', userId)
        .select('*, profiles(email, name)')
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al actualizar rol del miembro',
          details: error,
        });
      }

      if (!data) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'Miembro no encontrado',
        });
      }

      return Ok(mapDBRowToFamilyMember(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al actualizar rol',
        details: error,
      });
    }
  }

  /**
   * Remueve un miembro de una familia
   */
  async removeFamilyMember(familyId: string, userId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', userId);

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al remover miembro de la familia',
          details: error,
        });
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al remover miembro',
        details: error,
      });
    }
  }

  /**
   * Obtiene el rol de un miembro en una familia
   */
  async getMemberRole(familyId: string, userId: string): Promise<Result<FamilyRole>> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', userId)
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al obtener rol del miembro',
          details: error,
        });
      }

      if (!data) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'Miembro no encontrado',
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

  // ==================== OPERACIONES DE INVITATION ====================

  /**
   * Crea una nueva invitación
   */
  async createInvitation(
    familyId: string,
    email: string,
    role: FamilyRole,
    invitedBy: string
  ): Promise<Result<Invitation>> {
    try {
      const token = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          family_id: familyId,
          email,
          role,
          invited_by: invitedBy,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al crear invitación',
          details: error,
        });
      }

      return Ok(mapDBRowToInvitation(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al crear invitación',
        details: error,
      });
    }
  }

  /**
   * Obtiene una invitación por ID
   */
  async getInvitation(invitationId: string): Promise<Result<Invitation>> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al obtener invitación',
          details: error,
        });
      }

      if (!data) {
        return Err({
          code: ErrorCode.AUTH_INVALID_TOKEN,
          message: 'Invitación no encontrada',
        });
      }

      return Ok(mapDBRowToInvitation(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al obtener invitación',
        details: error,
      });
    }
  }

  /**
   * Obtiene una invitación por token
   */
  async getInvitationByToken(token: string): Promise<Result<Invitation>> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        return Err({
          code: ErrorCode.AUTH_INVALID_TOKEN,
          message: 'Token de invitación inválido',
          details: error,
        });
      }

      return Ok(mapDBRowToInvitation(data));
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al obtener invitación',
        details: error,
      });
    }
  }

  /**
   * Obtiene todas las invitaciones de una familia
   */
  async getFamilyInvitations(familyId: string): Promise<Result<Invitation[]>> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al obtener invitaciones',
          details: error,
        });
      }

      const invitations = (data || []).map(mapDBRowToInvitation);
      return Ok(invitations);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al obtener invitaciones',
        details: error,
      });
    }
  }

  /**
   * Acepta una invitación y agrega al usuario a la familia
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<Result<void>> {
    try {
      // Obtener la invitación
      const invitationResult = await this.getInvitation(invitationId);
      if (!invitationResult.ok) {
        return invitationResult;
      }

      const invitation = invitationResult.value;

      // Verificar que no esté expirada
      if (new Date() > invitation.expiresAt) {
        return Err({
          code: ErrorCode.AUTH_EXPIRED_TOKEN,
          message: 'Token de invitación expirado',
        });
      }

      // Verificar que esté pendiente
      if (invitation.status !== 'pending') {
        return Err({
          code: ErrorCode.AUTH_INVALID_TOKEN,
          message: 'Esta invitación ya fue procesada',
        });
      }

      // Agregar miembro a la familia
      const addMemberResult = await this.addFamilyMember(
        invitation.familyId,
        userId,
        invitation.role
      );

      if (!addMemberResult.ok) {
        return addMemberResult;
      }

      // Actualizar estado de la invitación
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al actualizar invitación',
          details: error,
        });
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al aceptar invitación',
        details: error,
      });
    }
  }

  /**
   * Cancela una invitación
   */
  async cancelInvitation(invitationId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({
          status: 'expired',
        })
        .eq('id', invitationId);

      if (error) {
        return Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error al cancelar invitación',
          details: error,
        });
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error inesperado al cancelar invitación',
        details: error,
      });
    }
  }
}

// Instancia singleton del servicio
let familyServiceInstance: FamilyService | null = null;

/**
 * Obtiene la instancia del servicio de familia
 */
export function getFamilyService(): IFamilyService {
  if (!familyServiceInstance) {
    familyServiceInstance = new FamilyService();
  }
  return familyServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para testing)
 */
export function resetFamilyService(): void {
  familyServiceInstance = null;
}
