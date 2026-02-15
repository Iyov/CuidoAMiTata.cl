/**
 * Family Manager
 * Capa de lógica de negocio para gestión multi-familiar
 * Maneja validaciones de permisos, reglas de negocio y coordinación entre servicios
 */

import type { Result } from '../types/result';
import { Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type { Family, FamilyMember, Invitation, FamilyRole } from '../types/models';
import { getFamilyService, type IFamilyService } from './FamilyService';

/**
 * Interfaz del manager de familia
 */
export interface IFamilyManager {
  createFamily(name: string, adminUserId: string): Promise<Result<Family>>;
  inviteMember(familyId: string, email: string, role: FamilyRole, invitedBy: string): Promise<Result<Invitation>>;
  removeMember(familyId: string, userId: string, requestingUserId: string): Promise<Result<void>>;
  updateMemberRole(familyId: string, userId: string, role: FamilyRole, requestingUserId: string): Promise<Result<void>>;
  getFamilyMembers(familyId: string): Promise<Result<FamilyMember[]>>;
  getUserFamilies(userId: string): Promise<Result<Family[]>>;
  acceptInvitation(invitationId: string, userId: string): Promise<Result<void>>;
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida que el rol sea válido
 */
function isValidRole(role: FamilyRole): boolean {
  return ['admin', 'cuidador', 'familiar'].includes(role);
}

/**
 * Implementación del manager de familia
 */
class FamilyManager implements IFamilyManager {
  private familyService: IFamilyService;

  constructor(familyService?: IFamilyService) {
    this.familyService = familyService || getFamilyService();
  }

  /**
   * Crea una nueva familia con el usuario como administrador
   */
  async createFamily(name: string, adminUserId: string): Promise<Result<Family>> {
    // Validar nombre no vacío
    if (!name || name.trim().length === 0) {
      return Err({
        code: ErrorCode.VALIDATION_REQUIRED_FIELD,
        message: 'El nombre de la familia es requerido',
      });
    }

    // Crear familia
    const familyResult = await this.familyService.createFamily(name.trim(), adminUserId);
    if (!familyResult.ok) {
      return familyResult;
    }

    const family = familyResult.value;

    // Agregar al creador como administrador
    const memberResult = await this.familyService.addFamilyMember(
      family.id,
      adminUserId,
      'admin'
    );

    if (!memberResult.ok) {
      // Si falla agregar el miembro, intentar limpiar la familia creada
      await this.familyService.deleteFamily(family.id);
      return Err({
        code: ErrorCode.SYNC_FAILED,
        message: 'Error al crear familia: no se pudo agregar el administrador',
        details: memberResult.error,
      });
    }

    return Ok(family);
  }

  /**
   * Invita un nuevo miembro a la familia
   * Solo administradores pueden invitar
   */
  async inviteMember(
    familyId: string,
    email: string,
    role: FamilyRole,
    invitedBy: string
  ): Promise<Result<Invitation>> {
    // Validar email
    if (!isValidEmail(email)) {
      return Err({
        code: ErrorCode.FAMILY_INVALID_EMAIL,
        message: 'El email ingresado no es válido',
      });
    }

    // Validar rol
    if (!isValidRole(role)) {
      return Err({
        code: ErrorCode.PERMISSION_INVALID_ROLE,
        message: 'Rol de usuario inválido',
      });
    }

    // Verificar que el usuario que invita es administrador
    const roleResult = await this.familyService.getMemberRole(familyId, invitedBy);
    if (!roleResult.ok) {
      return Err({
        code: ErrorCode.PERMISSION_DENIED,
        message: 'No tiene permisos para realizar esta acción',
      });
    }

    if (roleResult.value !== 'admin') {
      return Err({
        code: ErrorCode.FAMILY_NOT_ADMIN,
        message: 'Solo los administradores pueden realizar esta acción',
      });
    }

    // Crear invitación
    return await this.familyService.createInvitation(familyId, email, role, invitedBy);
  }

  /**
   * Remueve un miembro de la familia
   * Solo administradores pueden remover
   * No se puede remover al último administrador
   */
  async removeMember(
    familyId: string,
    userId: string,
    requestingUserId: string
  ): Promise<Result<void>> {
    // Verificar que el usuario que remueve es administrador
    const roleResult = await this.familyService.getMemberRole(familyId, requestingUserId);
    if (!roleResult.ok) {
      return Err({
        code: ErrorCode.PERMISSION_DENIED,
        message: 'No tiene permisos para realizar esta acción',
      });
    }

    if (roleResult.value !== 'admin') {
      return Err({
        code: ErrorCode.FAMILY_NOT_ADMIN,
        message: 'Solo los administradores pueden realizar esta acción',
      });
    }

    // Obtener rol del usuario a remover
    const targetRoleResult = await this.familyService.getMemberRole(familyId, userId);
    if (!targetRoleResult.ok) {
      return targetRoleResult;
    }

    // Si el usuario a remover es admin, verificar que no sea el último
    if (targetRoleResult.value === 'admin') {
      const membersResult = await this.familyService.getFamilyMembers(familyId);
      if (!membersResult.ok) {
        return membersResult;
      }

      const adminCount = membersResult.value.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        return Err({
          code: ErrorCode.FAMILY_LAST_ADMIN,
          message: 'No se puede remover al último administrador de la familia',
        });
      }
    }

    // Remover miembro
    return await this.familyService.removeFamilyMember(familyId, userId);
  }

  /**
   * Actualiza el rol de un miembro
   * Solo administradores pueden cambiar roles
   * No se puede cambiar el rol del último administrador
   */
  async updateMemberRole(
    familyId: string,
    userId: string,
    role: FamilyRole,
    requestingUserId: string
  ): Promise<Result<void>> {
    // Validar rol
    if (!isValidRole(role)) {
      return Err({
        code: ErrorCode.PERMISSION_INVALID_ROLE,
        message: 'Rol de usuario inválido',
      });
    }

    // Verificar que el usuario que actualiza es administrador
    const roleResult = await this.familyService.getMemberRole(familyId, requestingUserId);
    if (!roleResult.ok) {
      return Err({
        code: ErrorCode.PERMISSION_DENIED,
        message: 'No tiene permisos para realizar esta acción',
      });
    }

    if (roleResult.value !== 'admin') {
      return Err({
        code: ErrorCode.FAMILY_NOT_ADMIN,
        message: 'Solo los administradores pueden realizar esta acción',
      });
    }

    // Obtener rol actual del usuario
    const currentRoleResult = await this.familyService.getMemberRole(familyId, userId);
    if (!currentRoleResult.ok) {
      return currentRoleResult;
    }

    // Si el usuario actual es admin y se quiere cambiar a otro rol,
    // verificar que no sea el último admin
    if (currentRoleResult.value === 'admin' && role !== 'admin') {
      const membersResult = await this.familyService.getFamilyMembers(familyId);
      if (!membersResult.ok) {
        return membersResult;
      }

      const adminCount = membersResult.value.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        return Err({
          code: ErrorCode.FAMILY_LAST_ADMIN,
          message: 'No se puede cambiar el rol del último administrador de la familia',
        });
      }
    }

    // Actualizar rol
    const updateResult = await this.familyService.updateMemberRole(familyId, userId, role);
    if (!updateResult.ok) {
      return updateResult;
    }

    return Ok(undefined);
  }

  /**
   * Obtiene todos los miembros de una familia
   */
  async getFamilyMembers(familyId: string): Promise<Result<FamilyMember[]>> {
    return await this.familyService.getFamilyMembers(familyId);
  }

  /**
   * Obtiene todas las familias de un usuario
   */
  async getUserFamilies(userId: string): Promise<Result<Family[]>> {
    return await this.familyService.getUserFamilies(userId);
  }

  /**
   * Acepta una invitación y agrega al usuario a la familia
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<Result<void>> {
    return await this.familyService.acceptInvitation(invitationId, userId);
  }
}

// Instancia singleton del manager
let familyManagerInstance: FamilyManager | null = null;

/**
 * Obtiene la instancia del manager de familia
 */
export function getFamilyManager(): IFamilyManager {
  if (!familyManagerInstance) {
    familyManagerInstance = new FamilyManager();
  }
  return familyManagerInstance;
}

/**
 * Resetea la instancia del manager (útil para testing)
 */
export function resetFamilyManager(): void {
  familyManagerInstance = null;
}

export { FamilyManager };
