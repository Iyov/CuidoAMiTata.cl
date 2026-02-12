/**
 * Unit tests for HistoryService
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  HistoryService,
  getHistoryService,
  resetHistoryService,
  HistoryFilter,
} from './HistoryService';
import { CareEvent } from '../types/models';
import { CareEventType, SyncStatus } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';

describe('HistoryService', () => {
  let historyService: HistoryService;

  beforeEach(async () => {
    resetHistoryService();
    historyService = getHistoryService();
    await IndexedDBUtils.initDB();
  });

  afterEach(async () => {
    await IndexedDBUtils.clear(IndexedDBUtils.STORES.CARE_EVENTS);
  });

  describe('getHistory', () => {
    it('debe devolver eventos ordenados cronológicamente (DESC por defecto)', async () => {
      // Crear eventos con diferentes timestamps
      const events: CareEvent[] = [
        {
          id: '1',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          patientId: 'patient1',
          eventType: CareEventType.FALL,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
        {
          id: '3',
          patientId: 'patient1',
          eventType: CareEventType.POSTURAL_CHANGE,
          timestamp: new Date('2024-01-03T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-03T10:00:00Z'),
        },
      ];

      // Guardar eventos en orden aleatorio
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, events[1]);
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, events[0]);
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, events[2]);

      // Obtener historial
      const result = await historyService.getHistory('patient1', 'DESC');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        // Verificar orden descendente (más reciente primero)
        expect(result.value[0].id).toBe('3');
        expect(result.value[1].id).toBe('2');
        expect(result.value[2].id).toBe('1');
      }
    });

    it('debe devolver eventos ordenados cronológicamente (ASC)', async () => {
      const events: CareEvent[] = [
        {
          id: '1',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          patientId: 'patient1',
          eventType: CareEventType.FALL,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
      ];

      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, events[1]);
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, events[0]);

      const result = await historyService.getHistory('patient1', 'ASC');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        // Verificar orden ascendente (más antiguo primero)
        expect(result.value[0].id).toBe('1');
        expect(result.value[1].id).toBe('2');
      }
    });
  });

  describe('filterByEventType', () => {
    it('debe filtrar eventos por tipo', () => {
      const events: CareEvent[] = [
        {
          id: '1',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date(),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date(),
        },
        {
          id: '2',
          patientId: 'patient1',
          eventType: CareEventType.FALL,
          timestamp: new Date(),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date(),
        },
        {
          id: '3',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date(),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date(),
        },
      ];

      const filtered = historyService.filterByEventType(events, CareEventType.MEDICATION);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('1');
      expect(filtered[1].id).toBe('3');
    });
  });

  describe('filterByDateRange', () => {
    it('debe filtrar eventos por rango de fechas', () => {
      const events: CareEvent[] = [
        {
          id: '1',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          patientId: 'patient1',
          eventType: CareEventType.FALL,
          timestamp: new Date('2024-01-05T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-05T10:00:00Z'),
        },
        {
          id: '3',
          patientId: 'patient1',
          eventType: CareEventType.POSTURAL_CHANGE,
          timestamp: new Date('2024-01-10T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-10T10:00:00Z'),
        },
      ];

      const filtered = historyService.filterByDateRange(events, {
        start: new Date('2024-01-02T00:00:00Z'),
        end: new Date('2024-01-08T23:59:59Z'),
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('debe incluir eventos en los límites del rango', () => {
      const events: CareEvent[] = [
        {
          id: '1',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date('2024-01-01T00:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: '2',
          patientId: 'patient1',
          eventType: CareEventType.FALL,
          timestamp: new Date('2024-01-10T23:59:59Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-10T23:59:59Z'),
        },
      ];

      const filtered = historyService.filterByDateRange(events, {
        start: new Date('2024-01-01T00:00:00Z'),
        end: new Date('2024-01-10T23:59:59Z'),
      });

      expect(filtered).toHaveLength(2);
    });
  });

  describe('exportHistoryWithTimestamps', () => {
    it('debe exportar historial en formato JSON con timestamps preservados', () => {
      const events: CareEvent[] = [
        {
          id: '1',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      const result = historyService.exportHistoryWithTimestamps(events, 'JSON');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.format).toBe('JSON');
        expect(result.value.events).toEqual(events);
        
        // Verificar que el contenido JSON incluye timestamps
        const parsed = JSON.parse(result.value.content);
        expect(parsed[0].timestamp).toBe('2024-01-01T10:00:00.000Z');
        expect(parsed[0].createdAt).toBe('2024-01-01T10:00:00.000Z');
      }
    });

    it('debe exportar historial en formato CSV con timestamps preservados', () => {
      const events: CareEvent[] = [
        {
          id: '1',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      ];

      const result = historyService.exportHistoryWithTimestamps(events, 'CSV');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.format).toBe('CSV');
        expect(result.value.content).toContain('ID,Paciente ID,Tipo de Evento');
        expect(result.value.content).toContain('2024-01-01T10:00:00.000Z');
      }
    });
  });

  describe('isImmutable', () => {
    it('debe devolver true para eventos con más de 24 horas de antigüedad', () => {
      const oldEvent: CareEvent = {
        id: '1',
        patientId: 'patient1',
        eventType: CareEventType.MEDICATION,
        timestamp: new Date(),
        performedBy: 'caregiver1',
        syncStatus: SyncStatus.SYNCED,
        metadata: {},
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 horas atrás
      };

      expect(historyService.isImmutable(oldEvent)).toBe(true);
    });

    it('debe devolver false para eventos con menos de 24 horas de antigüedad', () => {
      const recentEvent: CareEvent = {
        id: '1',
        patientId: 'patient1',
        eventType: CareEventType.MEDICATION,
        timestamp: new Date(),
        performedBy: 'caregiver1',
        syncStatus: SyncStatus.SYNCED,
        metadata: {},
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 horas atrás
      };

      expect(historyService.isImmutable(recentEvent)).toBe(false);
    });
  });

  describe('updateEvent', () => {
    it('debe permitir actualizar eventos recientes', async () => {
      const event: CareEvent = {
        id: '1',
        patientId: 'patient1',
        eventType: CareEventType.MEDICATION,
        timestamp: new Date(),
        performedBy: 'caregiver1',
        syncStatus: SyncStatus.PENDING,
        metadata: {},
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
      };

      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);

      const result = await historyService.updateEvent('1', {
        syncStatus: SyncStatus.SYNCED,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.syncStatus).toBe(SyncStatus.SYNCED);
        expect(result.value.id).toBe('1');
        expect(result.value.createdAt).toEqual(event.createdAt);
      }
    });

    it('debe bloquear actualización de eventos inmutables', async () => {
      const oldEvent: CareEvent = {
        id: '1',
        patientId: 'patient1',
        eventType: CareEventType.MEDICATION,
        timestamp: new Date(),
        performedBy: 'caregiver1',
        syncStatus: SyncStatus.SYNCED,
        metadata: {},
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 horas atrás
      };

      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, oldEvent);

      const result = await historyService.updateEvent('1', {
        syncStatus: SyncStatus.PENDING,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('más de 24 horas');
      }
    });
  });

  describe('deleteEvent', () => {
    it('debe permitir eliminar eventos recientes', async () => {
      const event: CareEvent = {
        id: '1',
        patientId: 'patient1',
        eventType: CareEventType.MEDICATION,
        timestamp: new Date(),
        performedBy: 'caregiver1',
        syncStatus: SyncStatus.PENDING,
        metadata: {},
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
      };

      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);

      const result = await historyService.deleteEvent('1');

      expect(result.ok).toBe(true);

      // Verificar que el evento fue eliminado
      const deleted = await IndexedDBUtils.getById(IndexedDBUtils.STORES.CARE_EVENTS, '1');
      expect(deleted).toBeUndefined();
    });

    it('debe bloquear eliminación de eventos inmutables', async () => {
      const oldEvent: CareEvent = {
        id: '1',
        patientId: 'patient1',
        eventType: CareEventType.MEDICATION,
        timestamp: new Date(),
        performedBy: 'caregiver1',
        syncStatus: SyncStatus.SYNCED,
        metadata: {},
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 horas atrás
      };

      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, oldEvent);

      const result = await historyService.deleteEvent('1');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('más de 24 horas');
      }

      // Verificar que el evento NO fue eliminado
      const notDeleted = await IndexedDBUtils.getById(IndexedDBUtils.STORES.CARE_EVENTS, '1');
      expect(notDeleted).toBeDefined();
    });
  });

  describe('getHistoryStats', () => {
    it('debe devolver estadísticas del historial', async () => {
      const events: CareEvent[] = [
        {
          id: '1',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          patientId: 'patient1',
          eventType: CareEventType.MEDICATION,
          timestamp: new Date('2024-01-02T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
        {
          id: '3',
          patientId: 'patient1',
          eventType: CareEventType.FALL,
          timestamp: new Date('2024-01-03T10:00:00Z'),
          performedBy: 'caregiver1',
          syncStatus: SyncStatus.SYNCED,
          metadata: {},
          createdAt: new Date('2024-01-03T10:00:00Z'),
        },
      ];

      for (const event of events) {
        await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, event);
      }

      const result = await historyService.getHistoryStats('patient1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalEvents).toBe(3);
        expect(result.value.eventsByType[CareEventType.MEDICATION]).toBe(2);
        expect(result.value.eventsByType[CareEventType.FALL]).toBe(1);
        expect(result.value.oldestEvent).toEqual(new Date('2024-01-01T10:00:00Z'));
        expect(result.value.newestEvent).toEqual(new Date('2024-01-03T10:00:00Z'));
      }
    });
  });
});
