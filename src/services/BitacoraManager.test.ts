/**
 * Tests para BitacoraManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BitacoraManager, getBitacoraManager, resetBitacoraManager } from './BitacoraManager';
import type { IBitacoraService } from './BitacoraService';
import type { BitacoraEntry, BitacoraEntryInput } from '../types/models';
import { Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';

describe('BitacoraManager', () => {
  let manager: BitacoraManager;
  let mockService: IBitacoraService;

  beforeEach(() => {
    resetBitacoraManager();
    
    // Mock del servicio
    mockService = {
      save: vi.fn(),
      findByPatientAndDate: vi.fn(),
      findByPatientAndDateRange: vi.fn(),
      update: vi.fn(),
    };
    
    manager = new BitacoraManager(mockService);
  });

  describe('createEntry', () => {
    it('debe rechazar fecha futura', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const entry: BitacoraEntryInput = {
        patientId: 'patient-1',
        entryDate: tomorrow,
        breakfast: 'Pan con palta',
      };
      
      const result = await manager.createEntry(entry);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.BITACORA_FUTURE_DATE);
        expect(result.error.message).toBe('No se puede crear una entrada para una fecha futura');
      }
      expect(mockService.save).not.toHaveBeenCalled();
    });

    it('debe rechazar entrada vacía', async () => {
      const entry: BitacoraEntryInput = {
        patientId: 'patient-1',
        entryDate: new Date(),
      };
      
      const result = await manager.createEntry(entry);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.BITACORA_EMPTY_ENTRY);
        expect(result.error.message).toBe('Debe completar al menos un campo de la bitácora');
      }
      expect(mockService.save).not.toHaveBeenCalled();
    });

    it('debe rechazar entrada con solo espacios en blanco', async () => {
      const entry: BitacoraEntryInput = {
        patientId: 'patient-1',
        entryDate: new Date(),
        breakfast: '   ',
        lunch: '',
        moodNotes: '  ',
      };
      
      const result = await manager.createEntry(entry);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.BITACORA_EMPTY_ENTRY);
      }
    });

    it('debe aceptar entrada con solo desayuno', async () => {
      const entry: BitacoraEntryInput = {
        patientId: 'patient-1',
        entryDate: new Date(),
        breakfast: 'Pan con palta',
      };
      
      const savedEntry: BitacoraEntry = {
        id: 'entry-1',
        patientId: entry.patientId,
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: entry.entryDate,
        breakfast: entry.breakfast,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockService.save).mockResolvedValue(Ok(savedEntry));
      
      const result = await manager.createEntry(entry);
      
      expect(result.ok).toBe(true);
      expect(mockService.save).toHaveBeenCalledWith(entry);
    });

    it('debe aceptar entrada con solo ánimo', async () => {
      const entry: BitacoraEntryInput = {
        patientId: 'patient-1',
        entryDate: new Date(),
        mood: 'bien',
      };
      
      const savedEntry: BitacoraEntry = {
        id: 'entry-1',
        patientId: entry.patientId,
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: entry.entryDate,
        mood: entry.mood,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockService.save).mockResolvedValue(Ok(savedEntry));
      
      const result = await manager.createEntry(entry);
      
      expect(result.ok).toBe(true);
    });

    it('debe aceptar entrada con solo actividades', async () => {
      const entry: BitacoraEntryInput = {
        patientId: 'patient-1',
        entryDate: new Date(),
        activities: ['Paseo', 'Terapia'],
      };
      
      const savedEntry: BitacoraEntry = {
        id: 'entry-1',
        patientId: entry.patientId,
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: entry.entryDate,
        activities: entry.activities,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockService.save).mockResolvedValue(Ok(savedEntry));
      
      const result = await manager.createEntry(entry);
      
      expect(result.ok).toBe(true);
    });

    it('debe aceptar entrada completa', async () => {
      const entry: BitacoraEntryInput = {
        patientId: 'patient-1',
        entryDate: new Date(),
        breakfast: 'Pan con palta',
        lunch: 'Cazuela',
        dinner: 'Pollo con arroz',
        snacks: 'Fruta',
        mood: 'bien',
        moodNotes: 'Muy animado hoy',
        activities: ['Paseo', 'Visita familiar'],
        activityNotes: 'Disfrutó mucho la visita',
      };
      
      const savedEntry: BitacoraEntry = {
        id: 'entry-1',
        ...entry,
        familyId: 'family-1',
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockService.save).mockResolvedValue(Ok(savedEntry));
      
      const result = await manager.createEntry(entry);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.breakfast).toBe(entry.breakfast);
        expect(result.value.mood).toBe(entry.mood);
        expect(result.value.activities).toEqual(entry.activities);
      }
    });

    it('debe aceptar fecha de hoy', async () => {
      const today = new Date();
      const entry: BitacoraEntryInput = {
        patientId: 'patient-1',
        entryDate: today,
        breakfast: 'Pan con palta',
      };
      
      const savedEntry: BitacoraEntry = {
        id: 'entry-1',
        patientId: entry.patientId,
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: entry.entryDate,
        breakfast: entry.breakfast,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockService.save).mockResolvedValue(Ok(savedEntry));
      
      const result = await manager.createEntry(entry);
      
      expect(result.ok).toBe(true);
    });

    it('debe aceptar fecha del pasado', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const entry: BitacoraEntryInput = {
        patientId: 'patient-1',
        entryDate: yesterday,
        breakfast: 'Pan con palta',
      };
      
      const savedEntry: BitacoraEntry = {
        id: 'entry-1',
        patientId: entry.patientId,
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: entry.entryDate,
        breakfast: entry.breakfast,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockService.save).mockResolvedValue(Ok(savedEntry));
      
      const result = await manager.createEntry(entry);
      
      expect(result.ok).toBe(true);
    });
  });

  describe('getEntriesByDate', () => {
    it('debe delegar al servicio', async () => {
      const patientId = 'patient-1';
      const date = new Date();
      const entries: BitacoraEntry[] = [
        {
          id: 'entry-1',
          patientId,
          familyId: 'family-1',
          createdBy: 'user-1',
          entryDate: date,
          breakfast: 'Pan con palta',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      vi.mocked(mockService.findByPatientAndDate).mockResolvedValue(Ok(entries));
      
      const result = await manager.getEntriesByDate(patientId, date);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(entries);
      }
      expect(mockService.findByPatientAndDate).toHaveBeenCalledWith(patientId, date);
    });
  });

  describe('getEntriesByDateRange', () => {
    it('debe delegar al servicio', async () => {
      const patientId = 'patient-1';
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      const entries: BitacoraEntry[] = [];
      
      vi.mocked(mockService.findByPatientAndDateRange).mockResolvedValue(Ok(entries));
      
      const result = await manager.getEntriesByDateRange(patientId, start, end);
      
      expect(result.ok).toBe(true);
      expect(mockService.findByPatientAndDateRange).toHaveBeenCalledWith(patientId, start, end);
    });
  });

  describe('updateEntry', () => {
    it('debe rechazar actualización con fecha futura', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const updates: Partial<BitacoraEntryInput> = {
        entryDate: tomorrow,
        breakfast: 'Pan con palta',
      };
      
      const result = await manager.updateEntry('entry-1', updates);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.BITACORA_FUTURE_DATE);
      }
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it('debe aceptar actualización sin cambio de fecha', async () => {
      const updates: Partial<BitacoraEntryInput> = {
        breakfast: 'Pan con mantequilla',
      };
      
      const updatedEntry: BitacoraEntry = {
        id: 'entry-1',
        patientId: 'patient-1',
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: new Date(),
        breakfast: updates.breakfast,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockService.update).mockResolvedValue(Ok(updatedEntry));
      
      const result = await manager.updateEntry('entry-1', updates);
      
      expect(result.ok).toBe(true);
      expect(mockService.update).toHaveBeenCalledWith('entry-1', updates);
    });

    it('debe aceptar actualización con fecha válida', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const updates: Partial<BitacoraEntryInput> = {
        entryDate: yesterday,
        breakfast: 'Pan con palta',
      };
      
      const updatedEntry: BitacoraEntry = {
        id: 'entry-1',
        patientId: 'patient-1',
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: updates.entryDate!,
        breakfast: updates.breakfast,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      vi.mocked(mockService.update).mockResolvedValue(Ok(updatedEntry));
      
      const result = await manager.updateEntry('entry-1', updates);
      
      expect(result.ok).toBe(true);
    });
  });

  describe('canEdit', () => {
    it('debe retornar false si no es el creador', () => {
      const entry: BitacoraEntry = {
        id: 'entry-1',
        patientId: 'patient-1',
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: new Date(),
        breakfast: 'Pan con palta',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const canEdit = manager.canEdit(entry, 'user-2');
      
      expect(canEdit).toBe(false);
    });

    it('debe retornar true si es el creador y dentro de 24h', () => {
      const now = new Date();
      const entry: BitacoraEntry = {
        id: 'entry-1',
        patientId: 'patient-1',
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: now,
        breakfast: 'Pan con palta',
        createdAt: now,
        updatedAt: now,
      };
      
      const canEdit = manager.canEdit(entry, 'user-1');
      
      expect(canEdit).toBe(true);
    });

    it('debe retornar false si es el creador pero pasaron 24h', () => {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 25); // 25 horas atrás
      
      const entry: BitacoraEntry = {
        id: 'entry-1',
        patientId: 'patient-1',
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: yesterday,
        breakfast: 'Pan con palta',
        createdAt: yesterday,
        updatedAt: yesterday,
      };
      
      const canEdit = manager.canEdit(entry, 'user-1');
      
      expect(canEdit).toBe(false);
    });

    it('debe retornar true si es el creador y justo antes de 24h', () => {
      const almostADayAgo = new Date();
      almostADayAgo.setHours(almostADayAgo.getHours() - 23);
      almostADayAgo.setMinutes(almostADayAgo.getMinutes() - 59);
      
      const entry: BitacoraEntry = {
        id: 'entry-1',
        patientId: 'patient-1',
        familyId: 'family-1',
        createdBy: 'user-1',
        entryDate: almostADayAgo,
        breakfast: 'Pan con palta',
        createdAt: almostADayAgo,
        updatedAt: almostADayAgo,
      };
      
      const canEdit = manager.canEdit(entry, 'user-1');
      
      expect(canEdit).toBe(true);
    });
  });

  describe('singleton', () => {
    it('debe retornar la misma instancia', () => {
      resetBitacoraManager();
      const instance1 = getBitacoraManager();
      const instance2 = getBitacoraManager();
      
      expect(instance1).toBe(instance2);
    });

    it('debe crear nueva instancia después de reset', () => {
      resetBitacoraManager();
      const instance1 = getBitacoraManager();
      resetBitacoraManager();
      const instance2 = getBitacoraManager();
      
      expect(instance1).not.toBe(instance2);
    });
  });
});
