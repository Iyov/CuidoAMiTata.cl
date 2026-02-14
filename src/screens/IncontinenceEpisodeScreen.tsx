import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';
import { getIncontinenceManager } from '../services/IncontinenceManager';
import { IncontinenceSeverity } from '../types/enums';

export const IncontinenceEpisodeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [severity, setSeverity] = useState<IncontinenceSeverity | ''>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getSeverityLabel = (sev: IncontinenceSeverity): string => {
    const labels: Record<IncontinenceSeverity, string> = {
      [IncontinenceSeverity.MINOR]: 'Leve',
      [IncontinenceSeverity.MODERATE]: 'Moderado',
      [IncontinenceSeverity.MAJOR]: 'Severo',
    };
    return labels[sev];
  };

  const getSeverityDescription = (sev: IncontinenceSeverity): string => {
    const descriptions: Record<IncontinenceSeverity, string> = {
      [IncontinenceSeverity.MINOR]: 'Pequeña cantidad, ropa interior húmeda',
      [IncontinenceSeverity.MODERATE]: 'Cantidad moderada, requiere cambio de ropa',
      [IncontinenceSeverity.MAJOR]: 'Cantidad significativa, requiere limpieza completa',
    };
    return descriptions[sev];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const manager = getIncontinenceManager();
      const result = await manager.recordIncontinenceEpisode(
        'default-patient',
        new Date(),
        severity ? (severity as IncontinenceSeverity) : undefined,
        notes
      );

      if (result.ok) {
        setSuccess('✓ Episodio de incontinencia registrado correctamente');
        
        // Resetear formulario
        setSeverity('');
        setNotes('');
        
        // Redirigir después de 2 segundos
        setTimeout(() => navigate('/incontinence'), 2000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al registrar episodio de incontinencia');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Registrar Episodio de Incontinencia</h1>
          <Button variant="secondary" onClick={() => navigate('/incontinence')}>
            Volver
          </Button>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Severidad */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Severidad del episodio
              </label>
              <div className="space-y-3">
                {Object.values(IncontinenceSeverity).map((sev) => (
                  <label key={sev} className="flex items-start">
                    <input
                      type="radio"
                      name="severity"
                      value={sev}
                      checked={severity === sev}
                      onChange={(e) => setSeverity(e.target.value as IncontinenceSeverity)}
                      className="mr-2 mt-1"
                    />
                    <div>
                      <span className="font-medium">{getSeverityLabel(sev)}</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {getSeverityDescription(sev)}
                      </p>
                    </div>
                  </label>
                ))}
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="severity"
                    value=""
                    checked={severity === ''}
                    onChange={() => setSeverity('')}
                    className="mr-2 mt-1"
                  />
                  <span>No especificado</span>
                </label>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notas adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 min-h-[100px]"
                placeholder="Circunstancias, posibles causas, acciones tomadas..."
              />
            </div>

            {/* Información de timestamp */}
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                ⏰ Se registrará con la fecha y hora actual: {new Date().toLocaleString('es-ES')}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Registrar Episodio'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/incontinence')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        {/* Información importante */}
        <Card className="mt-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <h3 className="text-lg font-semibold mb-3 text-amber-900 dark:text-amber-100">
            ⚠️ Importante
          </h3>
          <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <li>• Registrar cada episodio ayuda a identificar patrones</li>
            <li>• Anota las circunstancias (actividad, hora del día, etc.)</li>
            <li>• Si los episodios aumentan, consulta con el médico</li>
            <li>• Mantén la higiene y el cuidado de la piel</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
