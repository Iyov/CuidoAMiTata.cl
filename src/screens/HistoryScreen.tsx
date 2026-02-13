/**
 * History Screen
 * Pantalla de historial con ordenamiento cronológico y filtros
 * Requisitos: 9.2, 9.3, 9.5, 13.5
 */

import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Input } from '../components/Input';
import { getHistoryService, SortOrder } from '../services/HistoryService';
import { getDataSyncService } from '../services/DataSyncService';
import { getPatientManager } from '../services/PatientManager';
import type { CareEvent, SyncMetadata } from '../types/models';
import { CareEventType, ConnectionStatus } from '../types/enums';

export const HistoryScreen: React.FC = () => {
  const [events, setEvents] = useState<CareEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CareEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata | null>(null);

  // Filtros
  const [selectedEventType, setSelectedEventType] = useState<CareEventType | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const historyService = getHistoryService();
  const patientManager = getPatientManager();

  useEffect(() => {
    loadHistory();
    loadSyncMetadata();

    // Escuchar cambios de paciente
    const handlePatientChange = () => {
      loadHistory();
    };
    window.addEventListener('patient-changed', handlePatientChange);

    return () => {
      window.removeEventListener('patient-changed', handlePatientChange);
    };
  }, [sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [events, selectedEventType, startDate, endDate]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentPatientId = patientManager.getCurrentPatientId();
      const result = await historyService.getHistory(currentPatientId || undefined, sortOrder);

      if (result.ok) {
        setEvents(result.value);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al cargar el historial');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncMetadata = async () => {
    try {
      const dataSyncService = await getDataSyncService();
      const result = await dataSyncService.getSyncMetadata();

      if (result.ok) {
        setSyncMetadata(result.value);
      }
    } catch (err) {
      console.error('Error al cargar metadatos de sincronización:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Filtrar por tipo de evento
    if (selectedEventType) {
      filtered = filtered.filter((event) => event.eventType === selectedEventType);
    }

    // Filtrar por rango de fechas
    if (startDate || endDate) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.timestamp);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && end) {
          return eventDate >= start && eventDate <= end;
        } else if (start) {
          return eventDate >= start;
        } else if (end) {
          return eventDate <= end;
        }
        return true;
      });
    }

    setFilteredEvents(filtered);
  };

  const handleToggleSortOrder = () => {
    setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
  };

  const handleClearFilters = () => {
    setSelectedEventType('');
    setStartDate('');
    setEndDate('');
  };

  const handleExport = () => {
    // Navegar a pantalla de exportación
    window.location.hash = '#/history/export';
  };

  const getEventTypeLabel = (type: CareEventType): string => {
    const labels: Record<CareEventType, string> = {
      [CareEventType.MEDICATION]: 'Medicación',
      [CareEventType.FALL]: 'Caída',
      [CareEventType.POSTURAL_CHANGE]: 'Cambio Postural',
      [CareEventType.NUTRITION]: 'Nutrición',
      [CareEventType.INCONTINENCE]: 'Incontinencia',
      [CareEventType.RESTRAINT]: 'Restricción',
      [CareEventType.ASSESSMENT]: 'Evaluación',
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type: CareEventType): string => {
    const colors: Record<CareEventType, string> = {
      [CareEventType.MEDICATION]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      [CareEventType.FALL]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      [CareEventType.POSTURAL_CHANGE]:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      [CareEventType.NUTRITION]:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      [CareEventType.INCONTINENCE]:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      [CareEventType.RESTRAINT]:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      [CareEventType.ASSESSMENT]:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colors[type] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  };

  const getSyncStatusIcon = (status: ConnectionStatus): string => {
    if (status === ConnectionStatus.ONLINE) {
      return '🟢';
    }
    return '🔴';
  };

  const getSyncStatusLabel = (status: ConnectionStatus): string => {
    if (status === ConnectionStatus.ONLINE) {
      return 'En línea';
    }
    return 'Sin conexión';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Historial de Cuidados
        </h1>
        <div className="flex items-center space-x-4">
          {/* Indicador de estado de sincronización */}
          {syncMetadata && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="text-lg">
                {getSyncStatusIcon(syncMetadata.connectionStatus)}
              </span>
              <div className="text-sm">
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {getSyncStatusLabel(syncMetadata.connectionStatus)}
                </p>
                {syncMetadata.pendingEvents > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {syncMetadata.pendingEvents} eventos pendientes
                  </p>
                )}
              </div>
            </div>
          )}
          <Button onClick={handleExport} variant="primary">
            Exportar Historial
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} className="mb-4" />
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por tipo de evento */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Evento
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value as CareEventType | '')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              {Object.values(CareEventType).map((type) => (
                <option key={type} value={type}>
                  {getEventTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por fecha de inicio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fecha de Inicio
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Seleccionar fecha"
            />
          </div>

          {/* Filtro por fecha de fin */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fecha de Fin
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Seleccionar fecha"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-end space-x-2">
            <Button onClick={handleClearFilters} variant="secondary" className="flex-1">
              Limpiar
            </Button>
            <Button onClick={handleToggleSortOrder} variant="secondary" className="flex-1">
              {sortOrder === 'DESC' ? '↓ Reciente' : '↑ Antiguo'}
            </Button>
          </div>
        </div>

        {/* Resumen de filtros */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando <span className="font-semibold">{filteredEvents.length}</span> de{' '}
            <span className="font-semibold">{events.length}</span> eventos
          </p>
        </div>
      </Card>

      {/* Lista de eventos */}
      {filteredEvents.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">
              {events.length === 0
                ? 'No hay eventos registrados'
                : 'No se encontraron eventos con los filtros aplicados'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Tipo de evento */}
                  <div className="flex items-center space-x-3 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(
                        event.eventType
                      )}`}
                    >
                      {getEventTypeLabel(event.eventType)}
                    </span>
                    {event.syncStatus === 'PENDING' && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                        Pendiente de sincronización
                      </span>
                    )}
                    {event.syncStatus === 'CONFLICT' && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs">
                        Conflicto
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {new Date(event.timestamp).toLocaleString('es-ES', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </p>

                  {/* Realizado por */}
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Realizado por: <span className="font-medium">{event.performedBy}</span>
                  </p>

                  {/* Metadatos adicionales */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Detalles:
                      </p>
                      <div className="space-y-1">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <p key={key} className="text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-medium">{key}:</span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fecha de creación */}
                <div className="text-right ml-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Registrado:</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {new Date(event.createdAt).toLocaleString('es-ES', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
