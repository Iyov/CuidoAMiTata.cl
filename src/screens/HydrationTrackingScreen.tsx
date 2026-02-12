import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert, Input } from '../components';
import { getNutritionManager } from '../services/NutritionManager';
import type { HydrationStatus, NutritionEvent } from '../types/models';
import { NutritionEventType } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';

export const HydrationTrackingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [hydrationStatus, setHydrationStatus] = useState<HydrationStatus | null>(null);
  const [glasses, setGlasses] = useState(1);
  const [recentEvents, setRecentEvents] = useState<NutritionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const manager = getNutritionManager();
      
      // Cargar estado de hidratación
      const statusResult = await manager.getDailyHydrationStatus('default-patient', 8);
      if (statusResult.ok) {
        setHydrationStatus(statusResult.value);
      }

      // Cargar eventos recientes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const allEvents = await IndexedDBUtils.getByIndex<NutritionEvent>(
        IndexedDBUtils.STORES.NUTRITION_EVENTS,
        'patientId',
        'default-patient'
      );

      const todayHydrationEvents = allEvents
        .filter(e => 
          e.type === NutritionEventType.HYDRATION &&
          new Date(e.occurredAt) >= today
        )
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 10);

      setRecentEvents(todayHydrationEvents);
    } catch (err) {
      setError('Error al cargar datos de hidratación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (glasses <= 0) {
        setError('El número de vasos debe ser mayor que 0');
        setSubmitting(false);
        return;
      }

      const manager = getNutritionManager();
      const result = await manager.recordFluidIntake('default-patient', glasses);

      if (result.ok) {
        setSuccess(`✓ Registrados ${glasses} vaso${glasses > 1 ? 's' : ''} de agua`);
        setGlasses(1);
        
        // Recargar datos
        await loadData();
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al registrar ingesta de líquidos');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <p className="text-center mt-8">Cargando seguimiento de hidratación...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Seguimiento de Hidratación</h1>
          <Button variant="secondary" onClick={() => navigate('/nutrition')}>
            Volver
          </Button>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        {/* Estado actual */}
        {hydrationStatus && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Estado de Hoy</h2>
            
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {hydrationStatus.currentGlasses}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  de {hydrationStatus.targetGlasses} vasos
                </div>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-6 mb-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-6 rounded-full transition-all flex items-center justify-center text-white text-sm font-semibold"
                style={{ width: `${Math.min(hydrationStatus.percentage, 100)}%` }}
              >
                {hydrationStatus.percentage >= 20 && `${Math.round(hydrationStatus.percentage)}%`}
              </div>
            </div>

            {hydrationStatus.percentage >= 100 ? (
              <p className="text-center text-green-600 dark:text-green-400 font-semibold mt-4">
                ✓ ¡Objetivo de hidratación alcanzado!
              </p>
            ) : (
              <p className="text-center text-slate-600 dark:text-slate-400 mt-4">
                Faltan {hydrationStatus.targetGlasses - hydrationStatus.currentGlasses} vaso{hydrationStatus.targetGlasses - hydrationStatus.currentGlasses > 1 ? 's' : ''} para alcanzar el objetivo
              </p>
            )}
          </Card>
        )}

        {/* Formulario de registro */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Registrar Ingesta</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Número de vasos de agua
              </label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setGlasses(Math.max(1, glasses - 1))}
                  disabled={glasses <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={glasses}
                  onChange={(e) => setGlasses(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                  className="text-center w-24"
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setGlasses(Math.min(10, glasses + 1))}
                  disabled={glasses >= 10}
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                💧 Aproximadamente {glasses * 250}ml
              </p>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Registrando...' : 'Registrar Ingesta'}
            </Button>
          </form>
        </Card>

        {/* Historial de hoy */}
        {recentEvents.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Historial de Hoy</h2>
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💧</span>
                    <div>
                      <p className="font-medium">
                        {event.fluidGlasses} vaso{event.fluidGlasses && event.fluidGlasses > 1 ? 's' : ''} de agua
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formatTime(event.occurredAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recordatorios */}
        <Card className="mt-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <h3 className="text-lg font-semibold mb-3 text-amber-900 dark:text-amber-100">
            💡 Consejos de Hidratación
          </h3>
          <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li>• Bebe agua regularmente durante todo el día</li>
            <li>• Objetivo: 6-8 vasos diarios (1.5-2 litros)</li>
            <li>• Aumenta la ingesta en días calurosos</li>
            <li>• Incluye infusiones y caldos en el conteo</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
