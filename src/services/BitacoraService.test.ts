/**
 * Tests para BitacoraService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBitacoraService, resetBitacoraService } from './BitacoraService';
import type { BitacoraEntryInput } from '../types/models';
import { supabase } from '../config/supabase';

// Mock de Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('BitacoraService', () => {
  beforeEach(() => {
    resetBitacoraService();
    vi.clearAllMocks();
  });

  describe('save', () => {
    it('debe guardar una entrada de bitácora exitosamente', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const mockPatient = { family_id: 'family-123' };
      const mockSavedEntry = {
        id: 'entry-123',
        patient_id: 'patient-123',
        family_id: 'family-123',
        created_by: 'user-123',
        entry_date: '2024-01-15',
        breakfast: 'Pan con palta',
        lunch: 'Cazuela',
        dinner: 'Porotos con riendas',
        snacks: 'Té con galletas',
        mood: 'bien',
        mood_notes: 'Día tranquilo',
        activities: ['paseo', 'lectura'],
        activity_notes: 'Caminata por el parque',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const entry: BitacoraEntryInput = {
        patientId: 'patient-123',
        entryDate: new Date('2024-01-15'),
        breakfast: 'Pan con palta',
        lunch: 'Cazuela',
        dinner: 'Porotos con riendas',
        snacks: 'Té con galletas',
        mood: 'bien',
        moodNotes: 'Día tranquilo',
        activities: ['paseo', 'lectura'],
        activityNotes: 'Caminata por el parque',
      };

      // Mock de las llamadas a Supabase
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPatient,
            error: null,
          }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockSavedEntry,
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'patients') {
          return { select: mockSelect } as any;
        }
        if (table === 'bitacora_entries') {
          return { insert: mockInsert } as any;
        }
        return {} as any;
      });

      // Act
      const service = getBitacoraService();
      const result = await service.save(entry);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('entry-123');
        expect(result.value.patientId).toBe('patient-123');
        expect(result.value.breakfast).toBe('Pan con palta');
        expect(result.value.mood).toBe('bien');
        expect(result.value.activities).toEqual(['paseo', 'lectura']);
      }
    });

    it('debe retornar error si el usuario no está autenticado', async () => {
      // Arrange
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' } as any,
      } as any);

      const entry: BitacoraEntryInput = {
        patientId: 'patient-123',
        entryDate: new Date('2024-01-15'),
        breakfast: 'Pan con palta',
      };

      // Act
      const service = getBitacoraService();
      const result = await service.save(entry);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Usuario no autenticado');
      }
    });
  });

  describe('findByPatientAndDate', () => {
    it('debe buscar entradas por paciente y fecha', async () => {
      // Arrange
      const mockEntries = [
        {
          id: 'entry-1',
          patient_id: 'patient-123',
          family_id: 'family-123',
          created_by: 'user-123',
          entry_date: '2024-01-15',
          breakfast: 'Pan con palta',
          lunch: null,
          dinner: null,
          snacks: null,
          mood: 'bien',
          mood_notes: null,
          activities: ['paseo'],
          activity_notes: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      const mockEq2 = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const service = getBitacoraService();
      const result = await service.findByPatientAndDate(
        'patient-123',
        new Date('2024-01-15')
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].id).toBe('entry-1');
        expect(result.value[0].breakfast).toBe('Pan con palta');
      }
    });
  });

  describe('findByPatientAndDateRange', () => {
    it('debe buscar entradas por paciente y rango de fechas', async () => {
      // Arrange
      const mockEntries = [
        {
          id: 'entry-1',
          patient_id: 'patient-123',
          family_id: 'family-123',
          created_by: 'user-123',
          entry_date: '2024-01-15',
          breakfast: 'Pan con palta',
          lunch: null,
          dinner: null,
          snacks: null,
          mood: 'bien',
          mood_notes: null,
          activities: null,
          activity_notes: null,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'entry-2',
          patient_id: 'patient-123',
          family_id: 'family-123',
          created_by: 'user-123',
          entry_date: '2024-01-16',
          breakfast: 'Avena',
          lunch: null,
          dinner: null,
          snacks: null,
          mood: 'regular',
          mood_notes: null,
          activities: null,
          activity_notes: null,
          created_at: '2024-01-16T10:00:00Z',
          updated_at: '2024-01-16T10:00:00Z',
        },
      ];

      const mockOrder2 = vi.fn().mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      const mockOrder1 = vi.fn().mockReturnValue({
        order: mockOrder2,
      });

      const mockLte = vi.fn().mockReturnValue({
        order: mockOrder1,
      });

      const mockGte = vi.fn().mockReturnValue({
        lte: mockLte,
      });

      const mockEq = vi.fn().mockReturnValue({
        gte: mockGte,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Act
      const service = getBitacoraService();
      const result = await service.findByPatientAndDateRange(
        'patient-123',
        new Date('2024-01-15'),
        new Date('2024-01-16')
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].id).toBe('entry-1');
        expect(result.value[1].id).toBe('entry-2');
      }
    });
  });

  describe('update', () => {
    it('debe actualizar una entrada de bitácora', async () => {
      // Arrange
      const mockUpdatedEntry = {
        id: 'entry-123',
        patient_id: 'patient-123',
        family_id: 'family-123',
        created_by: 'user-123',
        entry_date: '2024-01-15',
        breakfast: 'Pan con palta y huevo',
        lunch: 'Cazuela',
        dinner: null,
        snacks: null,
        mood: 'bien',
        mood_notes: 'Mejor ánimo',
        activities: null,
        activity_notes: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUpdatedEntry,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      // Act
      const service = getBitacoraService();
      const result = await service.update('entry-123', {
        breakfast: 'Pan con palta y huevo',
        moodNotes: 'Mejor ánimo',
      });

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('entry-123');
        expect(result.value.breakfast).toBe('Pan con palta y huevo');
        expect(result.value.moodNotes).toBe('Mejor ánimo');
      }
    });
  });
});
