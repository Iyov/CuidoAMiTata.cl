/**
 * Tests para FamilyManager
 * Valida lógica de negocio y reglas de permisos multi-familiar
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FamilyManager, getFamilyManager, resetFamilyManager } from './FamilyManager';
import type { IFamilyService } from './FamilyService';
import { ErrorCode } from '../types/enums';
import { Ok, Err } from '../types/result';
import type { Family, FamilyMember, Invitation, FamilyRole } from '../types/models';

// Mock del FamilyService
const createMockFamilyService = (): IFamilyService => ({
  createFamily: vi.fn(),
  getFamily: vi.fn(),
  updateFamily: vi.fn(),
  deleteFamily: vi.fn(),
  getUserFamilies: vi.fn(),
  addFamilyMember: vi.fn(),
  getFamilyMembers: vi.fn(),
  updateMemberRole: vi.fn(),
  removeFamilyMember: vi.fn(),
  getMemberRole: vi.fn(),
  createInvitation: vi.fn(),
  getInvitation: vi.fn(),
  getInvitationByToken: vi.fn(),
  getFamilyInvitations: vi.fn(),
  acceptInvitation: vi.fn(),
  cancelInvitation: vi.fn(),
});

describe('FamilyManager', () => {
  let mockService: IFamilyService;
  let manager: FamilyManager;

  beforeEach(() => {
    resetFamilyManager();
    mockService = createMockFamilyService();
    manager = new FamilyManager(mockService);
  });

  describe('createFamily', () => {
    it('debe crear una familia y agregar al creador como admin', async () => {
      // Arrange
      const mockFamily: Family = {
        id: 'family-123',
        name: 'Familia González',
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMember: FamilyMember = {
        id: 'member-123',
        familyId: 'family-123',
        userId: 'user-123',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        role: 'admin',
        joinedAt: new Date(),
      };

      vi.mocked(mockService.createFamily).mockResolvedValue(Ok(mockFamily));
      vi.mocked(mockService.addFamilyMember).mockResolvedValue(Ok(mockMember));

      // Act
      const result = await manager.createFamily('Familia González', 'user-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Familia González');
      }
      expect(mockService.createFamily).toHaveBeenCalledWith('Familia González', 'user-123');
      expect(mockService.addFamilyMember).toHaveBeenCalledWith('family-123', 'user-123', 'admin');
    });

    it('debe rechazar nombre vacío', async () => {
      // Act
      const result = await manager.createFamily('', 'user-123');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
        expect(result.error.message).toContain('nombre de la familia es requerido');
      }
    });

    it('debe limpiar la familia si falla agregar el admin', async () => {
      // Arrange
      const mockFamily: Family = {
        id: 'family-123',
        name: 'Familia González',
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockService.createFamily).mockResolvedValue(Ok(mockFamily));
      vi.mocked(mockService.addFamilyMember).mockResolvedValue(
        Err({ code: ErrorCode.SYNC_FAILED, message: 'Error al agregar miembro' })
      );
      vi.mocked(mockService.deleteFamily).mockResolvedValue(Ok(undefined));

      // Act
      const result = await manager.createFamily('Familia González', 'user-123');

      // Assert
      expect(result.ok).toBe(false);
      expect(mockService.deleteFamily).toHaveBeenCalledWith('family-123');
    });
  });

  describe('inviteMember', () => {
    it('debe permitir a un admin invitar un nuevo miembro', async () => {
      // Arrange
      const mockInvitation: Invitation = {
        id: 'invitation-123',
        familyId: 'family-123',
        email: 'nuevo@example.com',
        role: 'cuidador',
        invitedBy: 'user-admin',
        token: 'token-abc',
        status: 'pending',
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      vi.mocked(mockService.getMemberRole).mockResolvedValue(Ok('admin'));
      vi.mocked(mockService.createInvitation).mockResolvedValue(Ok(mockInvitation));

      // Act
      const result = await manager.inviteMember(
        'family-123',
        'nuevo@example.com',
        'cuidador',
        'user-admin'
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.email).toBe('nuevo@example.com');
        expect(result.value.role).toBe('cuidador');
      }
    });

    it('debe rechazar email inválido', async () => {
      // Act
      const result = await manager.inviteMember(
        'family-123',
        'email-invalido',
        'cuidador',
        'user-admin'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.FAMILY_INVALID_EMAIL);
        expect(result.error.message).toContain('email ingresado no es válido');
      }
    });

    it('debe rechazar rol inválido', async () => {
      // Act
      const result = await manager.inviteMember(
        'family-123',
        'nuevo@example.com',
        'rol-invalido' as FamilyRole,
        'user-admin'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.PERMISSION_INVALID_ROLE);
      }
    });

    it('debe rechazar invitación de usuario no-admin', async () => {
      // Arrange
      vi.mocked(mockService.getMemberRole).mockResolvedValue(Ok('cuidador'));

      // Act
      const result = await manager.inviteMember(
        'family-123',
        'nuevo@example.com',
        'familiar',
        'user-cuidador'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.FAMILY_NOT_ADMIN);
        expect(result.error.message).toContain('Solo los administradores');
      }
    });
  });

  describe('removeMember', () => {
    it('debe permitir a un admin remover un miembro no-admin', async () => {
      // Arrange
      const mockMembers: FamilyMember[] = [
        {
          id: 'member-1',
          familyId: 'family-123',
          userId: 'user-admin',
          userEmail: 'admin@example.com',
          userName: 'Admin',
          role: 'admin',
          joinedAt: new Date(),
        },
        {
          id: 'member-2',
          familyId: 'family-123',
          userId: 'user-cuidador',
          userEmail: 'cuidador@example.com',
          userName: 'Cuidador',
          role: 'cuidador',
          joinedAt: new Date(),
        },
      ];

      vi.mocked(mockService.getMemberRole)
        .mockResolvedValueOnce(Ok('admin')) // Usuario que remueve
        .mockResolvedValueOnce(Ok('cuidador')); // Usuario a remover
      vi.mocked(mockService.getFamilyMembers).mockResolvedValue(Ok(mockMembers));
      vi.mocked(mockService.removeFamilyMember).mockResolvedValue(Ok(undefined));

      // Act
      const result = await manager.removeMember('family-123', 'user-cuidador', 'user-admin');

      // Assert
      expect(result.ok).toBe(true);
      expect(mockService.removeFamilyMember).toHaveBeenCalledWith('family-123', 'user-cuidador');
    });

    it('debe rechazar remoción por usuario no-admin', async () => {
      // Arrange
      vi.mocked(mockService.getMemberRole).mockResolvedValue(Ok('familiar'));

      // Act
      const result = await manager.removeMember('family-123', 'user-otro', 'user-familiar');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.FAMILY_NOT_ADMIN);
      }
    });

    it('debe rechazar remoción del último admin', async () => {
      // Arrange
      const mockMembers: FamilyMember[] = [
        {
          id: 'member-1',
          familyId: 'family-123',
          userId: 'user-admin',
          userEmail: 'admin@example.com',
          userName: 'Admin',
          role: 'admin',
          joinedAt: new Date(),
        },
        {
          id: 'member-2',
          familyId: 'family-123',
          userId: 'user-cuidador',
          userEmail: 'cuidador@example.com',
          userName: 'Cuidador',
          role: 'cuidador',
          joinedAt: new Date(),
        },
      ];

      vi.mocked(mockService.getMemberRole)
        .mockResolvedValueOnce(Ok('admin')) // Usuario que remueve
        .mockResolvedValueOnce(Ok('admin')); // Usuario a remover
      vi.mocked(mockService.getFamilyMembers).mockResolvedValue(Ok(mockMembers));

      // Act
      const result = await manager.removeMember('family-123', 'user-admin', 'user-admin');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.FAMILY_LAST_ADMIN);
        expect(result.error.message).toContain('último administrador');
      }
    });
  });

  describe('updateMemberRole', () => {
    it('debe permitir a un admin cambiar rol de otro miembro', async () => {
      // Arrange
      const mockMember: FamilyMember = {
        id: 'member-2',
        familyId: 'family-123',
        userId: 'user-cuidador',
        userEmail: 'cuidador@example.com',
        userName: 'Cuidador',
        role: 'admin',
        joinedAt: new Date(),
      };

      const mockMembers: FamilyMember[] = [
        {
          id: 'member-1',
          familyId: 'family-123',
          userId: 'user-admin',
          userEmail: 'admin@example.com',
          userName: 'Admin',
          role: 'admin',
          joinedAt: new Date(),
        },
        mockMember,
      ];

      vi.mocked(mockService.getMemberRole)
        .mockResolvedValueOnce(Ok('admin')) // Usuario que actualiza
        .mockResolvedValueOnce(Ok('cuidador')); // Rol actual del usuario
      vi.mocked(mockService.getFamilyMembers).mockResolvedValue(Ok(mockMembers));
      vi.mocked(mockService.updateMemberRole).mockResolvedValue(Ok(mockMember));

      // Act
      const result = await manager.updateMemberRole(
        'family-123',
        'user-cuidador',
        'admin',
        'user-admin'
      );

      // Assert
      expect(result.ok).toBe(true);
      expect(mockService.updateMemberRole).toHaveBeenCalledWith(
        'family-123',
        'user-cuidador',
        'admin'
      );
    });

    it('debe rechazar rol inválido', async () => {
      // Act
      const result = await manager.updateMemberRole(
        'family-123',
        'user-cuidador',
        'rol-invalido' as FamilyRole,
        'user-admin'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.PERMISSION_INVALID_ROLE);
      }
    });

    it('debe rechazar cambio por usuario no-admin', async () => {
      // Arrange
      vi.mocked(mockService.getMemberRole).mockResolvedValue(Ok('cuidador'));

      // Act
      const result = await manager.updateMemberRole(
        'family-123',
        'user-otro',
        'familiar',
        'user-cuidador'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.FAMILY_NOT_ADMIN);
      }
    });

    it('debe rechazar cambio de rol del último admin', async () => {
      // Arrange
      const mockMembers: FamilyMember[] = [
        {
          id: 'member-1',
          familyId: 'family-123',
          userId: 'user-admin',
          userEmail: 'admin@example.com',
          userName: 'Admin',
          role: 'admin',
          joinedAt: new Date(),
        },
        {
          id: 'member-2',
          familyId: 'family-123',
          userId: 'user-cuidador',
          userEmail: 'cuidador@example.com',
          userName: 'Cuidador',
          role: 'cuidador',
          joinedAt: new Date(),
        },
      ];

      vi.mocked(mockService.getMemberRole)
        .mockResolvedValueOnce(Ok('admin')) // Usuario que actualiza
        .mockResolvedValueOnce(Ok('admin')); // Rol actual del usuario a cambiar
      vi.mocked(mockService.getFamilyMembers).mockResolvedValue(Ok(mockMembers));

      // Act
      const result = await manager.updateMemberRole(
        'family-123',
        'user-admin',
        'cuidador',
        'user-admin'
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.FAMILY_LAST_ADMIN);
        expect(result.error.message).toContain('último administrador');
      }
    });
  });

  describe('getFamilyMembers', () => {
    it('debe obtener todos los miembros de una familia', async () => {
      // Arrange
      const mockMembers: FamilyMember[] = [
        {
          id: 'member-1',
          familyId: 'family-123',
          userId: 'user-1',
          userEmail: 'user1@example.com',
          userName: 'User 1',
          role: 'admin',
          joinedAt: new Date(),
        },
        {
          id: 'member-2',
          familyId: 'family-123',
          userId: 'user-2',
          userEmail: 'user2@example.com',
          userName: 'User 2',
          role: 'cuidador',
          joinedAt: new Date(),
        },
      ];

      vi.mocked(mockService.getFamilyMembers).mockResolvedValue(Ok(mockMembers));

      // Act
      const result = await manager.getFamilyMembers('family-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].role).toBe('admin');
        expect(result.value[1].role).toBe('cuidador');
      }
    });
  });

  describe('getUserFamilies', () => {
    it('debe obtener todas las familias de un usuario', async () => {
      // Arrange
      const mockFamilies: Family[] = [
        {
          id: 'family-1',
          name: 'Familia González',
          createdBy: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'family-2',
          name: 'Familia Pérez',
          createdBy: 'user-456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(mockService.getUserFamilies).mockResolvedValue(Ok(mockFamilies));

      // Act
      const result = await manager.getUserFamilies('user-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].name).toBe('Familia González');
        expect(result.value[1].name).toBe('Familia Pérez');
      }
    });
  });

  describe('acceptInvitation', () => {
    it('debe aceptar una invitación válida', async () => {
      // Arrange
      vi.mocked(mockService.acceptInvitation).mockResolvedValue(Ok(undefined));

      // Act
      const result = await manager.acceptInvitation('invitation-123', 'user-456');

      // Assert
      expect(result.ok).toBe(true);
      expect(mockService.acceptInvitation).toHaveBeenCalledWith('invitation-123', 'user-456');
    });
  });

  describe('singleton pattern', () => {
    it('debe retornar la misma instancia', () => {
      // Act
      const instance1 = getFamilyManager();
      const instance2 = getFamilyManager();

      // Assert
      expect(instance1).toBe(instance2);
    });

    it('debe crear nueva instancia después de reset', () => {
      // Act
      const instance1 = getFamilyManager();
      resetFamilyManager();
      const instance2 = getFamilyManager();

      // Assert
      expect(instance1).not.toBe(instance2);
    });
  });
});
