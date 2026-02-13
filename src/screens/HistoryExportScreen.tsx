/**
 * History Export Screen
 * Pantalla de exportación de historial con confirmación
 * Requisitos: 9.3, 12.5
 */

import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Input } from '../components/Input';
import { getHistoryService, HistoryFilter, HistoryExport } from '../services/HistoryService';
import { getPatientManager } from '../services/PatientManager';
import type { CareEvent } from '../types/models';
import { CareEventType } from '../types/enums';

export const HistoryExportScreen: React.FC = () => {
  const [events, setEvents] = useState<CareEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [exportFormat, setExportFormat] = useState<'JSON' | 'CSV'>('JSON');

  // Filtros para exportación
  const [selectedEventType, setSelectedEventType] = useState<CareEventType | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const historyService = getHistoryService();
  const patientManager = getPatientManager();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentPatientId = patientManager.getCurrentPatientId();

      // Construir filtro
      const filter: HistoryFilter = {
        patientId: currentPatientId || undefined,
      };

      if (selectedEventType) {
        filter.eventType = selectedEventType;
      }

      if (startDate && endDate) {
        filter.dateRange = {
          start: new Date(startDate),
          end: new Date(endDate),
        };
      }

      const result = await historyService.getFilteredHistory(filter, 'DESC');

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

  const handleApplyFilters = () => {
    loadHistory();
  };

  const handleRequestExport = () => {
    if (events.length === 0) {
      setError('No hay eventos para exportar');
      return;
    }

    // Mostrar confirmación
    setShowConfirmation(true);
    setError(null);
    setSuccess(null);
  };

  const handleConfirmExport = () => {
    try {
      setError(null);
      setSuccess(null);

      // Preparar eventos para exportación
      let eventsToExport = [...events];

      // Si no se incluyen metadatos, eliminarlos
      if (!includeMetadata) {
        eventsToExport = eventsToExport.map((event) => ({
          ...event,
          metadata: {},
        }));
      }

      // Exportar con timestamps preservados
      const result = historyService.exportHistoryWithTimestamps(eventsToExport, exportFormat);

      if (result.ok) {
        const exportData = result.value;

        // Crear blob y descargar
        const blob = new Blob([exportData.content], {
          type: exportFormat === 'JSON' ? 'application/json' : 'text/csv',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `historial_${new Date().toISOString().split('T')[0]}.${exportFormat.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccess(
          `Historial exportado exitosamente. ${exportData.events.length} eventos exportados en formato ${exportFormat}.`
        );
        setShowConfirmation(false);
      } else {
        setError(result.error.message);
        setShowConfirmation(false);
      }
    } catch (err) {
      setError('Error al exportar el historial');
      console.error(err);
      setShowConfirmation(false);
    }
  };

  const handleCancelExport = () => {
    setShowConfirmation(false);
  };

  const handleBack = () => {
    window.location.hash = '#/history';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Preparando exportación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button onClick={handleBack} variant="secondary" size="sm" className="mr-4">
          ← Volver
        </Button>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Exportar Historial
        </h1>
      </div>

      {error && (
        <Alert type="error" message={error} className="mb-4" />
      )}

      {success && (
        <Alert type="success" message={success} className="mb-4" />
      )}

      {/* Modal de confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Confirmar Exportación
            </h2>
            <div className="mb-6">
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Está a punto de exportar <span className="font-bold">{events.length}</span> eventos
                de cuidado en formato <span className="font-bold">{exportFormat}</span>.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <span className="font-semibold">⚠ Importante:</span> Los datos exportados
                  contienen información médica sensible. Asegúrese de manejarlos de forma segura y
                  cumplir con las regulaciones de privacidad aplicables.
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Formato:</span> {exportFormat}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Eventos:</span> {events.length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Incluye metadatos:</span>{' '}
                  {includeMetadata ? 'Sí' : 'No'}
                </p>
                {startDate && endDate && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Rango de fechas:</span>{' '}
                    {new Date(startDate).toLocaleDateString('es-ES')} -{' '}
                    {new Date(endDate).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleCancelExport} variant="secondary" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleConfirmExport} variant="primary" className="flex-1">
                Confirmar Exportación
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Configuración de exportación */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Configuración de Exportación
        </h2>

        <div className="space-y-4">
          {/* Formato de exportación */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Formato de Exportación
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="JSON"
                  checked={exportFormat === 'JSON'}
                  onChange={(e) => setExportFormat(e.target.value as 'JSON' | 'CSV')}
                  className="mr-2"
                />
                <span className="text-slate-700 dark:text-slate-300">JSON</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="CSV"
                  checked={exportFormat === 'CSV'}
                  onChange={(e) => setExportFormat(e.target.value as 'JSON' | 'CSV')}
                  className="mr-2"
                />
                <span className="text-slate-700 dark:text-slate-300">CSV</span>
              </label>
            </div>
          </div>

          {/* Incluir metadatos */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Incluir metadatos adicionales
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Filtros de exportación */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Filtros de Exportación
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        <div className="mt-4">
          <Button onClick={handleApplyFilters} variant="secondary" className="w-full">
            Aplicar Filtros
          </Button>
        </div>
      </Card>

      {/* Vista previa de datos */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Vista Previa
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Total de eventos:
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {events.length}
            </span>
          </div>

          {events.length > 0 && (
            <>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Evento más antiguo:
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date(events[events.length - 1].timestamp).toLocaleDateString('es-ES')}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Evento más reciente:
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date(events[0].timestamp).toLocaleDateString('es-ES')}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Botón de exportación */}
      <div className="flex justify-center">
        <Button
          onClick={handleRequestExport}
          variant="primary"
          size="lg"
          disabled={events.length === 0}
          className="w-full md:w-auto"
        >
          {events.length === 0 ? 'No hay eventos para exportar' : 'Exportar Historial'}
        </Button>
      </div>

      {/* Información adicional */}
      <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
          ℹ Información sobre la Exportación
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>• Todos los timestamps se preservan en el formato exportado</li>
          <li>• Los datos exportados incluyen marcas temporales de creación y registro</li>
          <li>• El formato JSON es más completo y fácil de procesar programáticamente</li>
          <li>• El formato CSV es más compatible con hojas de cálculo</li>
          <li>• Los datos exportados contienen información médica sensible</li>
        </ul>
      </Card>
    </div>
  );
};
