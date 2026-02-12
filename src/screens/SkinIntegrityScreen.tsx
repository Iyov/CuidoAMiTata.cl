import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components';
import { getSkinIntegrityManager } from '../services/SkinIntegrityManager';
import type { PosturalChange, PressureUlcer } from '../types/models';

export const SkinIntegrityScreen: React.FC = () => {
  const navigate = useNavigate();
  const [posturalChanges, setPosturalChanges] = useState<PosturalChange[]>([]);
  const [pressureUlcers, setPressureUlcers] = useState<PressureUlcer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const manager = getSkinIntegrityManager();
      const patientId = 'default-patient'; // TODO: usar paciente seleccionado
      
      const changes = await manager.getPosturalChanges(patientId);
      const ulcers = await manager.getPressureUlcers(patientId);
      
      setPosturalChanges(changes);
      setPressureUlcers(ulcers);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionLabel = (position: string): string => {
    const labels: Record<string, string> = {
      SUPINE: 'Supino (boca arriba)',
      LEFT_LATERAL: 'Lateral izquierdo',
      RIGHT_LATERAL: 'Lateral derecho',
      PRONE: 'Prono (boca abajo)',
      SEATED: 'Sentado',
    };
    return labels[position] || position;
  };

  const getGradeLabel = (grade: string): string => {
    const labels: Record<string, string> = {
      I: 'Grado I - Eritema no blanqueable',
      II: 'Grado II - Pérdida parcial del grosor de la piel',
      III: 'Grado III - Pérdida total del grosor de la piel',
      IV: 'Grado IV - Pérdida total del tejido',
    };
    return labels[grade] || grade;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <div className="max-w-4xl mx-auto">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Integridad de la Piel</h1>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button onClick={() => navigate('/skin-integrity/postural-change')}>
            Registrar Cambio Postural
          </Button>
          <Button onClick={() => navigate('/skin-integrity/bed-elevation')}>
            Registrar Elevación de Cama
          </Button>
          <Button onClick={() => navigate('/skin-integrity/pressure-ulcer')}>
            Registrar Úlcera por Presión
          </Button>
        </div>

        {/* Cambios posturales recientes */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Cambios Posturales Recientes</h2>
          {posturalChanges.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">
              No hay cambios posturales registrados
            </p>
          ) : (
            <div className="space-y-3">
              {posturalChanges.slice(0, 5).map((change) => (
                <div
                  key={change.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{getPositionLabel(change.position)}</p>
                      {change.bedElevation !== undefined && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Elevación: {change.bedElevation}°
                        </p>
                      )}
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Por: {change.performedBy}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(change.performedAt).toLocaleString('es-ES')}
                    </p>
                  </div>
                  {change.notes && (
                    <p className="text-sm mt-2 text-slate-700 dark:text-slate-300">
                      {change.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Úlceras por presión activas */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Úlceras por Presión</h2>
          {pressureUlcers.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">
              No hay úlceras por presión registradas
            </p>
          ) : (
            <div className="space-y-4">
              {pressureUlcers.map((ulcer) => (
                <div
                  key={ulcer.id}
                  className="p-4 border border-slate-300 dark:border-slate-600 rounded-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-red-600 dark:text-red-400">
                        {getGradeLabel(ulcer.grade)}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Ubicación: {ulcer.location}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        ulcer.healingStatus === 'IMPROVING'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : ulcer.healingStatus === 'WORSENING'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {ulcer.healingStatus === 'NEW' && 'Nueva'}
                      {ulcer.healingStatus === 'IMPROVING' && 'Mejorando'}
                      {ulcer.healingStatus === 'STABLE' && 'Estable'}
                      {ulcer.healingStatus === 'WORSENING' && 'Empeorando'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Tamaño: {ulcer.size.length} × {ulcer.size.width} cm
                    {ulcer.size.depth && ` × ${ulcer.size.depth} cm`}
                  </p>
                  {ulcer.treatment && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      Tratamiento: {ulcer.treatment}
                    </p>
                  )}
                  {ulcer.photos && ulcer.photos.length > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      📷 {ulcer.photos.length} fotografía(s)
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Evaluada: {new Date(ulcer.assessedAt).toLocaleString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
