/**
 * Tests para FamilyService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getFamilyService, resetFamilyService } from './FamilyService';
import type { FamilyRole } from '../types/models';
import { supabase } from '../config/supabase';
import { ErrorCode } from '../types/enums';

// Mock de Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('FamilyService', () => {
  beforeEach(() => {
    resetFamilyService();
    vi.clearAllMocks();
  });

  describe('createFamily', () => {
    it('debe crear una familia exitosamente', async () => {
      // Arrange
      const mockFamily = {
        id: 'family-123',
        name: 'Familia González',
        created_by: 'user-123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockFamily,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.createFamily('Familia González', 'user-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('family-123');
        expect(result.value.name).toBe('Familia González');
        expect(result.value.createdBy).toBe('user-123');
      }
    });

    it('debe retornar error si falla la creación', async () => {
      // Arrange
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.createFamily('Familia González', 'user-123');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.SYNC_FAILED);
      }
    });
  });

  describe('getFamily', () => {
    it('debe obtener una familia por ID', async () => {
      // Arrange
      const mockFamily = {
        id: 'family-123',
        name: 'Familia González',
        created_by: 'user-123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockFamily,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.getFamily('family-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('family-123');
        expect(result.value.name).toBe('Familia González');
      }
    });
  });

  describe('getUserFamilies', () => {
    it('debe obtener todas las familias de un usuario', async () => {
      // Arrange
      const mockData = [
        {
          families: {
            id: 'family-1',
            name: 'Familia González',
            created_by: 'user-123',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
          },
        },
        {
          families: {
            id: 'family-2',
            name: 'Familia Pérez',
            created_by: 'user-456',
            created_at: '2024-01-16T10:00:00Z',
            updated_at: '2024-01-16T10:00:00Z',
          },
        },
      ];

      const mockEq = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.getUserFamilies('user-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].name).toBe('Familia González');
        expect(result.value[1].name).toBe('Familia Pérez');
      }
    });
  });

  describe('addFamilyMember', () => {
    it('debe agregar un miembro a una familia', async () => {
      // Arrange
      const mockMember = {
        id: 'member-123',
        family_id: 'family-123',
        user_id: 'user-456',
        role: 'cuidador',
        joined_at: '2024-01-15T10:00:00Z',
        profiles: {
          email: 'juan@example.com',
          name: 'Juan Pérez',
        },
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.addFamilyMember('family-123', 'user-456', 'cuidador');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.familyId).toBe('family-123');
        expect(result.value.userId).toBe('user-456');
        expect(result.value.role).toBe('cuidador');
        expect(result.value.userEmail).toBe('juan@example.com');
      }
    });

    it('debe retornar error si el miembro ya existe', async () => {
      // Arrange
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Duplicate key' },
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.addFamilyMember('family-123', 'user-456', 'cuidador');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.FAMILY_MEMBER_EXISTS);
      }
    });
  });

  describe('getFamilyMembers', () => {
    it('debe obtener todos los miembros de una familia', async () => {
      // Arrange
      const mockMembers = [
        {
          id: 'member-1',
          family_id: 'family-123',
          user_id: 'user-1',
          role: 'admin',
          joined_at: '2024-01-15T10:00:00Z',
          profiles: {
            email: 'admin@example.com',
            name: 'Admin User',
          },
        },
        {
          id: 'member-2',
          family_id: 'family-123',
          user_id: 'user-2',
          role: 'cuidador',
          joined_at: '2024-01-16T10:00:00Z',
          profiles: {
            email: 'cuidador@example.com',
            name: 'Cuidador User',
          },
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockMembers,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.getFamilyMembers('family-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].role).toBe('admin');
        expect(result.value[1].role).toBe('cuidador');
      }
    });
  });

  describe('updateMemberRole', () => {
    it('debe actualizar el rol de un miembro', async () => {
      // Arrange
      const mockMember = {
        id: 'member-123',
        family_id: 'family-123',
        user_id: 'user-456',
        role: 'admin',
        joined_at: '2024-01-15T10:00:00Z',
        profiles: {
          email: 'juan@example.com',
          name: 'Juan Pérez',
        },
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.updateMemberRole('family-123', 'user-456', 'admin');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.role).toBe('admin');
      }
    });
  });

  describe('removeFamilyMember', () => {
    it('debe remover un miembro de una familia', async () => {
      // Arrange
      const mockEq2 = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.removeFamilyMember('family-123', 'user-456');

      // Assert
      expect(result.ok).toBe(true);
    });
  });

  describe('createInvitation', () => {
    it('debe crear una invitación exitosamente', async () => {
      // Arrange
      const mockInvitation = {
        id: 'invitation-123',
        family_id: 'family-123',
        email: 'nuevo@example.com',
        role: 'familiar',
        invited_by: 'user-123',
        token: 'token-abc-123',
        status: 'pending',
        expires_at: '2024-01-22T10:00:00Z',
        accepted_at: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockInvitation,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.createInvitation(
        'family-123',
        'nuevo@example.com',
        'familiar',
        'user-123'
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.email).toBe('nuevo@example.com');
        expect(result.value.role).toBe('familiar');
        expect(result.value.status).toBe('pending');
        expect(result.value.token).toBeTruthy();
      }
    });
  });

  describe('getInvitationByToken', () => {
    it('debe obtener una invitación por token', async () => {
      // Arrange
      const mockInvitation = {
        id: 'invitation-123',
        family_id: 'family-123',
        email: 'nuevo@example.com',
        role: 'familiar',
        invited_by: 'user-123',
        token: 'token-abc-123',
        status: 'pending',
        expires_at: '2024-01-22T10:00:00Z',
        accepted_at: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockInvitation,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.getInvitationByToken('token-abc-123');

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.token).toBe('token-abc-123');
        expect(result.value.status).toBe('pending');
      }
    });

    it('debe retornar error si el token es inválido', async () => {
      // Arrange
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.getInvitationByToken('invalid-token');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.AUTH_INVALID_TOKEN);
      }
    });
  });

  describe('acceptInvitation', () => {
    it('debe aceptar una invitación y agregar al usuario a la familia', async () => {
      // Arrange
      const mockInvitation = {
        id: 'invitation-123',
        family_id: 'family-123',
        email: 'nuevo@example.com',
        role: 'familiar',
        invited_by: 'user-123',
        token: 'token-abc-123',
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockMember = {
        id: 'member-123',
        family_id: 'family-123',
        user_id: 'user-456',
        role: 'familiar',
        joined_at: '2024-01-15T10:00:00Z',
        profiles: {
          email: 'nuevo@example.com',
          name: 'Nuevo Usuario',
        },
      };

      // Mock getInvitation
      const mockGetInvitationSingle = vi.fn().mockResolvedValue({
        data: mockInvitation,
        error: null,
      });

      const mockGetInvitationEq = vi.fn().mockReturnValue({
        single: mockGetInvitationSingle,
      });

      const mockGetInvitationSelect = vi.fn().mockReturnValue({
        eq: mockGetInvitationEq,
      });

      // Mock addFamilyMember
      const mockAddMemberSingle = vi.fn().mockResolvedValue({
        data: mockMember,
        error: null,
      });

      const mockAddMemberSelect = vi.fn().mockReturnValue({
        single: mockAddMemberSingle,
      });

      const mockAddMemberInsert = vi.fn().mockReturnValue({
        select: mockAddMemberSelect,
      });

      // Mock update invitation
      const mockUpdateEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockUpdateEq,
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'invitations') {
          // Primera llamada es getInvitation, segunda es update
          const callCount = vi.mocked(supabase.from).mock.calls.filter(
            (call) => call[0] === 'invitations'
          ).length;
          
          if (callCount === 1) {
            return {
              select: mockGetInvitationSelect,
            } as any;
          } else {
            return {
              update: mockUpdate,
            } as any;
          }
        }
        if (table === 'family_members') {
          return {
            insert: mockAddMemberInsert,
          } as any;
        }
        return {} as any;
      });

      // Act
      const service = getFamilyService();
      const result = await service.acceptInvitation('invitation-123', 'user-456');

      // Assert
      expect(result.ok).toBe(true);
    });

    it('debe retornar error si la invitación está expirada', async () => {
      // Arrange
      const mockInvitation = {
        id: 'invitation-123',
        family_id: 'family-123',
        email: 'nuevo@example.com',
        role: 'familiar',
        invited_by: 'user-123',
        token: 'token-abc-123',
        status: 'pending',
        expires_at: '2024-01-01T10:00:00Z', // Fecha pasada
        accepted_at: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockInvitation,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const service = getFamilyService();
      const result = await service.acceptInvitation('invitation-123', 'user-456');

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.AUTH_EXPIRED_TOKEN);
      }
    });
  });
});
