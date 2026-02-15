import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FamilyProvider, useFamily } from './FamilyContext';
import React from 'react';
import type { Family, FamilyMember } from '../types/models';
import { Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';

// Mock de Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock de FamilyManager (usar instancia compartida para que los tests y el proveedor accedan al mismo mock)
const _mockFamilyManager = {
  getUserFamilies: vi.fn(),
  getFamilyMembers: vi.fn(),
};
vi.mock('../services/FamilyManager', () => ({
  getFamilyManager: vi.fn(() => _mockFamilyManager),
}));

import { supabase } from '../config/supabase';
import { getFamilyManager } from '../services/FamilyManager';

// Requisitos: 5.5, 7.1, 7.2, 7.3, 7.5

describe('FamilyContext - Pruebas Unitarias', () => {
  const FAMILY_STORAGE_KEY = 'cuido-a-mi-tata-current-family';

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockFamilies: Family[] = [
    {
      id: 'family-1',
      name: 'Familia González',
      createdBy: 'user-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'family-2',
      name: 'Familia Pérez',
      createdBy: 'user-456',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockMembers: FamilyMember[] = [
    {
      id: 'member-1',
      familyId: 'family-1',
      userId: 'user-123',
      userEmail: 'test@example.com',
      userName: 'Juan González',
      role: 'admin',
      joinedAt: new Date('2024-01-01'),
    },
    {
      id: 'member-2',
      familyId: 'family-1',
      userId: 'user-789',
      userEmail: 'maria@example.com',
      userName: 'María González',
      role: 'cuidador',
      joinedAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Mock por defecto: usuario autenticado
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    } as any);

    // Mock por defecto: familias del usuario
    const mockManager = getFamilyManager();
    vi.mocked(mockManager.getUserFamilies).mockResolvedValue(Ok(mockFamilies));
    vi.mocked(mockManager.getFamilyMembers).mockResolvedValue(Ok(mockMembers));
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Requisito 7.1: Selector de familia para usuarios multi-familia', () => {
    it('debe cargar las familias del usuario al iniciar', async () => {
      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      // Inicialmente está cargando
      expect(result.current.isLoading).toBe(true);

      // Esperar a que termine de cargar
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.families).toHaveLength(2);
      expect(result.current.families[0].name).toBe('Familia González');
      expect(result.current.families[1].name).toBe('Familia Pérez');
    });

    it('debe seleccionar la primera familia por defecto si no hay familia guardada', async () => {
      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentFamily).not.toBeNull();
      expect(result.current.currentFamily?.id).toBe('family-1');
      expect(result.current.currentFamily?.name).toBe('Familia González');
    });

    it('debe mostrar lista vacía si el usuario no tiene familias', async () => {
      const mockManager = getFamilyManager();
      vi.mocked(mockManager.getUserFamilies).mockResolvedValue(Ok([]));

      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.families).toHaveLength(0);
      expect(result.current.currentFamily).toBeNull();
      expect(result.current.members).toHaveLength(0);
    });
  });

  describe('Requisito 7.2: Cargar datos solo para familia seleccionada', () => {
    it('debe cargar miembros de la familia seleccionada', async () => {
      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.members).toHaveLength(2);
      expect(result.current.members[0].userName).toBe('Juan González');
      expect(result.current.members[1].userName).toBe('María González');
    });

    it('debe recargar miembros al cambiar de familia', async () => {
      const mockManager = getFamilyManager();
      const family2Members: FamilyMember[] = [
        {
          id: 'member-3',
          familyId: 'family-2',
          userId: 'user-456',
          userEmail: 'pedro@example.com',
          userName: 'Pedro Pérez',
          role: 'admin',
          joinedAt: new Date('2024-01-02'),
        },
      ];

      vi.mocked(mockManager.getFamilyMembers)
        .mockResolvedValueOnce(Ok(mockMembers)) // Primera carga
        .mockResolvedValueOnce(Ok(family2Members)); // Después del cambio

      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verificar miembros iniciales
      expect(result.current.members).toHaveLength(2);

      // Cambiar de familia
      await act(async () => {
        await result.current.switchFamily('family-2');
      });

      // Verificar nuevos miembros
      expect(result.current.members).toHaveLength(1);
      expect(result.current.members[0].userName).toBe('Pedro Pérez');
    });
  });

  describe('Requisito 7.3: Persistir familia seleccionada', () => {
    it('debe guardar familia seleccionada en localStorage', async () => {
      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const storedFamilyId = localStorage.getItem(FAMILY_STORAGE_KEY);
      expect(storedFamilyId).toBe('family-1');
    });

    it('debe restaurar familia guardada después de reload (simulado)', async () => {
      // Primera sesión: guardar familia 2
      localStorage.setItem(FAMILY_STORAGE_KEY, 'family-2');

      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verificar que se restauró la familia 2
      expect(result.current.currentFamily?.id).toBe('family-2');
      expect(result.current.currentFamily?.name).toBe('Familia Pérez');
    });

    it('debe persistir cambio de familia en localStorage', async () => {
      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Cambiar a familia 2
      await act(async () => {
        await result.current.switchFamily('family-2');
      });

      const storedFamilyId = localStorage.getItem(FAMILY_STORAGE_KEY);
      expect(storedFamilyId).toBe('family-2');
    });

    it('debe limpiar localStorage si el usuario no tiene familias', async () => {
      const mockManager = getFamilyManager();
      vi.mocked(mockManager.getUserFamilies).mockResolvedValue(Ok([]));

      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const storedFamilyId = localStorage.getItem(FAMILY_STORAGE_KEY);
      expect(storedFamilyId).toBeNull();
    });
  });

  describe('Requisito 7.5: Cambio de familia sin requerir logout', () => {
    it('debe permitir cambiar de familia sin cerrar sesión', async () => {
      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentFamily?.id).toBe('family-1');

      // Cambiar de familia
      await act(async () => {
        await result.current.switchFamily('family-2');
      });

      expect(result.current.currentFamily?.id).toBe('family-2');
      expect(result.current.currentFamily?.name).toBe('Familia Pérez');
    });

    it('debe recargar datos al cambiar de familia', async () => {
      const mockManager = getFamilyManager();
      
      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Cambiar de familia
      await act(async () => {
        await result.current.switchFamily('family-2');
      });

      // Verificar que se llamó getFamilyMembers con el nuevo ID
      expect(mockManager.getFamilyMembers).toHaveBeenCalledWith('family-2');
    });
  });

  describe('Requisito 5.5: Contextos separados por familia', () => {
    it('debe mantener contextos separados al cambiar de familia', async () => {
      const mockManager = getFamilyManager();
      const family2Members: FamilyMember[] = [
        {
          id: 'member-3',
          familyId: 'family-2',
          userId: 'user-456',
          userEmail: 'pedro@example.com',
          userName: 'Pedro Pérez',
          role: 'admin',
          joinedAt: new Date('2024-01-02'),
        },
      ];

      vi.mocked(mockManager.getFamilyMembers)
        .mockResolvedValueOnce(Ok(mockMembers))
        .mockResolvedValueOnce(Ok(family2Members));

      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Familia 1: 2 miembros
      expect(result.current.currentFamily?.id).toBe('family-1');
      expect(result.current.members).toHaveLength(2);

      // Cambiar a familia 2
      await act(async () => {
        await result.current.switchFamily('family-2');
      });

      // Familia 2: 1 miembro (contexto diferente)
      expect(result.current.currentFamily?.id).toBe('family-2');
      expect(result.current.members).toHaveLength(1);
    });
  });

  describe('Función refreshMembers', () => {
    it('debe recargar miembros de la familia actual', async () => {
      const mockManager = getFamilyManager();
      const updatedMembers: FamilyMember[] = [
        ...mockMembers,
        {
          id: 'member-3',
          familyId: 'family-1',
          userId: 'user-999',
          userEmail: 'nuevo@example.com',
          userName: 'Nuevo Miembro',
          role: 'familiar',
          joinedAt: new Date('2024-01-03'),
        },
      ];

      vi.mocked(mockManager.getFamilyMembers)
        .mockResolvedValueOnce(Ok(mockMembers))
        .mockResolvedValueOnce(Ok(updatedMembers));

      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.members).toHaveLength(2);

      // Refrescar miembros
      await act(async () => {
        await result.current.refreshMembers();
      });

      expect(result.current.members).toHaveLength(3);
      expect(result.current.members[2].userName).toBe('Nuevo Miembro');
    });

    it('no debe hacer nada si no hay familia actual', async () => {
      const mockManager = getFamilyManager();
      vi.mocked(mockManager.getUserFamilies).mockResolvedValue(Ok([]));

      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentFamily).toBeNull();

      // Intentar refrescar sin familia
      await act(async () => {
        await result.current.refreshMembers();
      });

      // No debe haber errores
      expect(result.current.members).toHaveLength(0);
    });
  });

  describe('Manejo de autenticación', () => {
    it('debe limpiar estado si el usuario no está autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' } as any,
      } as any);

      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.families).toHaveLength(0);
      expect(result.current.currentFamily).toBeNull();
      expect(result.current.members).toHaveLength(0);
    });

    it('debe manejar error al cargar familias', async () => {
      const mockManager = getFamilyManager();
      vi.mocked(mockManager.getUserFamilies).mockResolvedValue(
        Err({
          code: ErrorCode.SYNC_FAILED,
          message: 'Error de red',
        })
      );

      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.families).toHaveLength(0);
      expect(result.current.currentFamily).toBeNull();
    });
  });

  describe('Manejo de errores', () => {
    it('debe lanzar error si useFamily se usa fuera de FamilyProvider', () => {
      expect(() => {
        renderHook(() => useFamily());
      }).toThrow('useFamily debe usarse dentro de un FamilyProvider');
    });

    it('debe manejar familia no encontrada al cambiar', async () => {
      const { result } = renderHook(() => useFamily(), {
        wrapper: ({ children }) => <FamilyProvider>{children}</FamilyProvider>,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const currentFamily = result.current.currentFamily;

      // Intentar cambiar a familia inexistente
      await act(async () => {
        await result.current.switchFamily('family-999');
      });

      // Debe mantener la familia actual
      expect(result.current.currentFamily).toEqual(currentFamily);
    });
  });
});
