import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';
import { getNutritionManager } from '../services/NutritionManager';
import type { HydrationStatus } from '../types/models';

export const NutritionScreen: React.FC = () => {
  const navigate = useNavigate();
  const [hydrationStatus, setHydrationStatus] = useState<HydrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHydrationStatus();
  }, []);

  const loadHydrationStatus = async () => {
    try {
      setLoading(true);
      const manager = getNutritionManager();
      const result = await manager.getDailyHydrationStatus('default-patient', 8);
      
      if (result.ok) {
        setHydrationStatus(result.value);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al cargar estado de hidratación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <p className="text-center mt-8">Cargando información nutricional...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Nutrición e Hidratación</h1>

        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        {/* Resumen de hidratación */}
        {hydrationStatus && (
          <Card className="mb-4">
            <h2 className="text-xl font-semibold mb-4">Estado de Hidratación Hoy</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {hydrationStatus.currentGlasses} / {hydrationStatus.targetGlasses}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">vasos de agua</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold">
                  {Math.round(hydrationStatus.percentage)}%
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">completado</p>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mb-4">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-4 rounded-full transition-all"
                style={{ width: `${Math.min(hydrationStatus.percentage, 100)}%` }}
              />
            </div>

            <Button
              onClick={() => navigate('/nutrition/hydration')}
              className="w-full"
            >
              Registrar Ingesta de Líquidos
            </Button>
          </Card>
        )}

        {/* Opciones de nutrición */}
        <div className="space-y-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/nutrition/meal-plan')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Plan de Comidas</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Ver plan dietético para adultos mayores
                </p>
              </div>
              <span className="text-2xl">🍽️</span>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/nutrition/hydration')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Seguimiento de Hidratación</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Registrar ingesta de líquidos y ver historial
                </p>
              </div>
              <span className="text-2xl">💧</span>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/nutrition/meal-intake')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Registrar Comida</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Registrar ingesta de alimentos
                </p>
              </div>
              <span className="text-2xl">📝</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
