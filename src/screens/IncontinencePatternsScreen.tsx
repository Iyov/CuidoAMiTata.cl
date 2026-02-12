import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert, Input } from '../components';
import { getIncontinenceManager } from '../services/IncontinenceManager';
import type { PatternAnalysis, IncontinenceEvent } from '../types/models';
import { IncontinenceEventType } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';

export const IncontinencePatternsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [recentEvents, setRecentEvents] = useState<IncontinenceEvent[]>([]);
  const [daysToAnalyze, setDaysToAnalyze] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, [daysToAnalyze]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToAnalyze);

      const manager = getIncontinenceManager();
      const analysisResult = await manager.analyzePatterns('default-patient', {
        start: startDate,
        end: endDate,
      });

      setAnalysis(analysisResult);

      // Cargar eventos recientes
      const allEvents = await IndexedDBUtils.getByIndex<IncontinenceEvent>(
        IndexedDBUtils.STORES.INCONTINENCE_EVENTS,
        'patientId',
        'default-patient'
      );

      const filteredEvents = allEvents
        .filter(e => {
          const eventDate = new Date(e.occurredAt);
          return eventDate >= startDate && eventDate <= endDate;
        })
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 20);

      setRecentEvents(filteredEvents);
    } catch (err) {
      setError('Error al cargar análisis de patrones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeLabel = (type: IncontinenceEventType): string => {
    const labels: Record<IncontinenceEventType, string> = {
      [IncontinenceEventType.BATHROOM_VISIT]: 'Visita al baño',
      [IncontinenceEventType.EPISODE]: 'Episodio',
    };
    return labels[type];
  };

  const getEventIcon = (type: IncontinenceEventType): string => {
    return type === IncontinenceEventType.BATHROOM_VISIT ? '🚽' : '⚠️';
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <p className="text-center mt-8">Analizando patrones...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Análisis de Patrones</h1>
          <Button variant="secondary" onClick={() => navigate('/incontinence')}>
            Volver
          </Button>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        {/* Selector de período */}
        <Card className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Período de análisis
          </label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={daysToAnalyze}
              onChange={(e) => setDaysToAnalyze(Math.max(1, parseInt(e.target.value) || 7))}
              min="1"
              max="90"
              className="w-24"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">días</span>
            <Button size="sm" onClick={loadAnalysis}>
              Actualizar
            </Button>
          </div>
        </Card>

        {/* Estadísticas */}
        {analysis && (
          <>
            <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total de eventos</p>
                  <p className="text-3xl font-bold">{analysis.totalEvents}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Promedio por día</p>
                  <p className="text-3xl font-bold">{analysis.averagePerDay.toFixed(1)}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Período</p>
                  <p className="text-3xl font-bold">{daysToAnalyze}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">días</p>
                </div>
              </div>

              {/* Tendencias */}
              {analysis.trends.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tendencias Identificadas</h3>
                  <ul className="space-y-2">
                    {analysis.trends.map((trend, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                        <span className="text-slate-700 dark:text-slate-300">{trend}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Historial de eventos */}
            {recentEvents.length > 0 && (
              <Card>
                <h2 className="text-xl font-semibold mb-4">Historial de Eventos</h2>
                <div className="space-y-2">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 py-3 border-b border-slate-200 dark:border-slate-700 last:border-0"
                    >
                      <span className="text-2xl">{getEventIcon(event.type)}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{getEventTypeLabel(event.type)}</p>
                            {event.type === IncontinenceEventType.BATHROOM_VISIT && event.success !== undefined && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {event.success ? '✓ Exitosa' : '✗ Sin resultado'}
                              </p>
                            )}
                            {event.type === IncontinenceEventType.EPISODE && event.severity && (
                              <p className="text-sm text-amber-600 dark:text-amber-400">
                                Severidad: {event.severity}
                              </p>
                            )}
                            {event.notes && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {event.notes}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-slate-500 dark:text-slate-500">
                            {formatDateTime(event.occurredAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {recentEvents.length === 0 && (
              <Card>
                <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                  No hay eventos registrados en el período seleccionado
                </p>
              </Card>
            )}
          </>
        )}

        {/* Recomendaciones */}
        <Card className="mt-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
            💡 Recomendaciones
          </h3>
          <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
            <li>• Mantén un horario regular de visitas al baño</li>
            <li>• Identifica patrones de horarios con mayor frecuencia</li>
            <li>• Ajusta los recordatorios según los patrones observados</li>
            <li>• Consulta con el médico si hay cambios significativos</li>
            <li>• Registra factores que puedan influir (dieta, medicamentos, actividad)</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
