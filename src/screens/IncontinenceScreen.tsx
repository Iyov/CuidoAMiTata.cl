import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components';

export const IncontinenceScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Control de Incontinencia</h1>

        <div className="space-y-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/incontinence/bathroom-visit')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Registrar Visita al Baño</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Registrar visita programada o espontánea
                </p>
              </div>
              <span className="text-2xl">🚽</span>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/incontinence/episode')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Registrar Episodio</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Registrar episodio de incontinencia
                </p>
              </div>
              <span className="text-2xl">⚠️</span>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/incontinence/patterns')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Análisis de Patrones</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Ver tendencias y estadísticas
                </p>
              </div>
              <span className="text-2xl">📊</span>
            </div>
          </Card>
        </div>

        {/* Información sobre recordatorios */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            ℹ️ Recordatorios de Baño
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            El sistema programa recordatorios automáticos cada 2-3 horas para ayudar a mantener un horario regular.
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Registrar las visitas y episodios ayuda a identificar patrones y ajustar el plan de cuidados.
          </p>
        </Card>
      </div>
    </div>
  );
};
