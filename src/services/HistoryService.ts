/**
 * History Service
 * Gestiona historial de eventos de cuidado con filtrado, ordenamiento y exportación
 * Implementa protección de inmutabilidad para registros históricos
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode, CareEventType } from '../types/enums';
import { CareEvent, DateRange } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

/**
 * Opciones de ordenamiento para el historial
 */
export type SortOrder = 'ASC' | 'DESC';

/**
 * Opciones de filtrado para el historial
 */
export interface HistoryFilter {
  patientId?: string;
  eventType?: CareEventType;
  dateRange?: DateRange;
}

/**
 * Resultado de exportación de historial
 */
export interface HistoryExport {
  events: CareEvent[];
  exportedAt: Date;
  format: 'JSON' | 'CSV';
  content: string;
}

/**
 * Servicio de historial y auditoría
 */
export class HistoryService {
  private readonly IMMUTABILITY_THRESHOLD_HOURS = 24;

  /**
   * Obtiene el historial de eventos con ordenamiento cronológico
   * @param patientId - ID del paciente (opcional, si no se proporciona devuelve todos)
   * @param sortOrder - Orden de clasificación (ASC = más antiguo primero, DESC = más reciente primero)
   */
  async getHistory(
    patientId?: string,
    sortOrder: SortOrder = 'DESC'
  ): Promise<Result<CareEvent[]>> {
    try {
      let events: CareEvent[];

      if (patientId) {
        // Obtener eventos de un paciente específico
        events = await IndexedDBUtils.getByIndex<CareEvent>(
          IndexedDBUtils.STORES.CARE_EVENTS,
          'patientId',
          patientId
        );
      } else {
        // Obtener todos los eventos
        events = await IndexedDBUtils.getAll<CareEvent>(IndexedDBUtils.STORES.CARE_EVENTS);
      }

      // Ordenar cronológicamente
      events.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'ASC' ? timeA - timeB : timeB - timeA;
      });

      return Ok(events);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al obtener el historial de eventos',
        details: error,
      });
    }
  }

  /**
   * Filtra eventos por tipo
   * @param events - Lista de eventos a filtrar
   * @param eventType - Tipo de evento a filtrar
   */
  filterByEventType(events: CareEvent[], eventType: CareEventType): CareEvent[] {
    return events.filter((event) => event.eventType === eventType);
  }

  /**
   * Filtra eventos por rango de fechas
   * @param events - Lista de eventos a filtrar
   * @param dateRange - Rango de fechas (start y end)
   */
  filterByDateRange(events: CareEvent[], dateRange: DateRange): CareEvent[] {
    const startTime = new Date(dateRange.start).getTime();
    const endTime = new Date(dateRange.end).getTime();

    return events.filter((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= startTime && eventTime <= endTime;
    });
  }

  /**
   * Obtiene historial con filtros aplicados
   * @param filter - Opciones de filtrado
   * @param sortOrder - Orden de clasificación
   */
  async getFilteredHistory(
    filter: HistoryFilter,
    sortOrder: SortOrder = 'DESC'
  ): Promise<Result<CareEvent[]>> {
    // Obtener historial base
    const historyResult = await this.getHistory(filter.patientId, sortOrder);

    if (!historyResult.ok) {
      return historyResult;
    }

    let events = historyResult.value;

    // Aplicar filtro por tipo de evento
    if (filter.eventType) {
      events = this.filterByEventType(events, filter.eventType);
    }

    // Aplicar filtro por rango de fechas
    if (filter.dateRange) {
      events = this.filterByDateRange(events, filter.dateRange);
    }

    return Ok(events);
  }

  /**
   * Exporta historial con timestamps preservados
   * @param events - Eventos a exportar
   * @param format - Formato de exportación ('JSON' o 'CSV')
   */
  exportHistoryWithTimestamps(
    events: CareEvent[],
    format: 'JSON' | 'CSV' = 'JSON'
  ): Result<HistoryExport> {
    try {
      let content: string;

      if (format === 'JSON') {
        // OPTIMIZACIÓN: Usar streaming para grandes conjuntos de datos
        // Para conjuntos pequeños, usar stringify directo
        if (events.length < 1000) {
          content = JSON.stringify(
            events.map((event) => ({
              ...event,
              timestamp: event.timestamp.toISOString(),
              createdAt: event.createdAt.toISOString(),
            })),
            null,
            2
          );
        } else {
          // Para conjuntos grandes, construir JSON manualmente para mejor rendimiento
          const jsonEvents = events.map((event) =>
            JSON.stringify({
              ...event,
              timestamp: event.timestamp.toISOString(),
              createdAt: event.createdAt.toISOString(),
            })
          );
          content = '[\n  ' + jsonEvents.join(',\n  ') + '\n]';
        }
      } else {
        // OPTIMIZACIÓN: Usar array join para CSV en lugar de concatenación
        const headers = [
          'ID',
          'Paciente ID',
          'Tipo de Evento',
          'Timestamp',
          'Realizado Por',
          'Estado de Sincronización',
          'Creado En',
        ];

        const rows = events.map((event) => [
          event.id,
          event.patientId,
          event.eventType,
          event.timestamp.toISOString(),
          event.performedBy,
          event.syncStatus,
          event.createdAt.toISOString(),
        ]);

        content = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      }

      return Ok({
        events,
        exportedAt: new Date(),
        format,
        content,
      });
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_EXPORT_FAILED,
        message: 'Error al exportar el historial',
        details: error,
      });
    }
  }

  /**
   * Verifica si un registro es inmutable (más de 24 horas de antigüedad)
   * @param event - Evento a verificar
   */
  isImmutable(event: CareEvent): boolean {
    const now = new Date().getTime();
    const eventTime = new Date(event.createdAt).getTime();
    const hoursSinceCreation = (now - eventTime) / (1000 * 60 * 60);

    return hoursSinceCreation >= this.IMMUTABILITY_THRESHOLD_HOURS;
  }

  /**
   * Intenta modificar un evento (bloqueado si es inmutable)
   * @param eventId - ID del evento a modificar
   * @param updates - Actualizaciones a aplicar
   */
  async updateEvent(
    eventId: string,
    updates: Partial<CareEvent>
  ): Promise<Result<CareEvent>> {
    try {
      // Obtener el evento existente
      const existingEvent = await IndexedDBUtils.getById<CareEvent>(
        IndexedDBUtils.STORES.CARE_EVENTS,
        eventId
      );

      if (!existingEvent) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: `No se encontró el evento con ID: ${eventId}`,
        });
      }

      // Verificar inmutabilidad
      if (this.isImmutable(existingEvent)) {
        return Err({
          code: ErrorCode.BUSINESS_HISTORICAL_RECORD_IMMUTABLE,
          message:
            'No se pueden modificar registros históricos con más de 24 horas de antigüedad',
        });
      }

      // Aplicar actualizaciones
      const updatedEvent: CareEvent = {
        ...existingEvent,
        ...updates,
        id: existingEvent.id, // Preservar ID
        createdAt: existingEvent.createdAt, // Preservar fecha de creación
      };

      // Guardar evento actualizado
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, updatedEvent);

      return Ok(updatedEvent);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al actualizar el evento',
        details: error,
      });
    }
  }

  /**
   * Intenta eliminar un evento (bloqueado si es inmutable)
   * @param eventId - ID del evento a eliminar
   */
  async deleteEvent(eventId: string): Promise<Result<void>> {
    try {
      // Obtener el evento existente
      const existingEvent = await IndexedDBUtils.getById<CareEvent>(
        IndexedDBUtils.STORES.CARE_EVENTS,
        eventId
      );

      if (!existingEvent) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: `No se encontró el evento con ID: ${eventId}`,
        });
      }

      // Verificar inmutabilidad
      if (this.isImmutable(existingEvent)) {
        return Err({
          code: ErrorCode.BUSINESS_HISTORICAL_RECORD_IMMUTABLE,
          message:
            'No se pueden eliminar registros históricos con más de 24 horas de antigüedad',
        });
      }

      // Eliminar evento
      await IndexedDBUtils.deleteById(IndexedDBUtils.STORES.CARE_EVENTS, eventId);

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.SYSTEM_STORAGE_QUOTA_EXCEEDED,
        message: 'Error al eliminar el evento',
        details: error,
      });
    }
  }

  /**
   * Obtiene estadísticas del historial
   * @param patientId - ID del paciente (opcional)
   */
  async getHistoryStats(patientId?: string): Promise<
    Result<{
      totalEvents: number;
      eventsByType: Record<CareEventType, number>;
      oldestEvent?: Date;
      newestEvent?: Date;
    }>
  > {
    const historyResult = await this.getHistory(patientId, 'ASC');

    if (!historyResult.ok) {
      return historyResult;
    }

    const events = historyResult.value;

    // Contar eventos por tipo
    const eventsByType: Record<CareEventType, number> = {} as Record<CareEventType, number>;
    events.forEach((event) => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    });

    return Ok({
      totalEvents: events.length,
      eventsByType,
      oldestEvent: events.length > 0 ? new Date(events[0].timestamp) : undefined,
      newestEvent:
        events.length > 0 ? new Date(events[events.length - 1].timestamp) : undefined,
    });
  }
}

// Instancia singleton del servicio
let historyServiceInstance: HistoryService | null = null;

/**
 * Obtiene la instancia singleton del HistoryService
 */
export function getHistoryService(): HistoryService {
  if (!historyServiceInstance) {
    historyServiceInstance = new HistoryService();
  }
  return historyServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetHistoryService(): void {
  historyServiceInstance = null;
}
