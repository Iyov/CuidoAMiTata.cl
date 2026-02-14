import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';
import { getSkinIntegrityManager } from '../services/SkinIntegrityManager';
import type { PosturalChange } from '../types/models';
import { Position } from '../types/enums';

export const PosturalChangeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState<Position | ''>('');
  const [performedBy, setPerformedBy] = useState('Cuidador Principal');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!position) {
        setError('Debe seleccionar una posición');
        setLoading(false);
        return;
      }

      if (!performedBy.trim()) {
        setError('Debe indicar quién realizó el cambio');
        setLoading(false);
        return;
      }

      const posturalChange: PosturalChange = {
        id: `postural-${Date.now()}`,
        patientId: 'default-patient', // TODO: usar paciente seleccionado
        position: position as Position,
        performedAt: new Date(),
        performedBy,
        notes,
        createdAt: new Date(),
      };

      const manager = getSkinIntegrityManager();
      const result = await manager.recordPosturalChange(posturalChange);

      if (result.ok) {
        setSuccess('Cambio postural registrado correctamente');
        setTimeout(() => navigate('/skin-integrity'), 2000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al registrar cambio postural');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const positionOptions = [
    { value: Position.SUPINE, label: 'Supino (boca arriba)' },
    { value: Position.LEFT_LATERAL, label: 'Lateral izquierdo' },
    { value: Position.RIGHT_LATERAL, label: 'Lateral derecho' },
    { value: Position.PRONE, label: 'Prono (boca abajo)' },
    { value: Position.SEATED, label: 'Sentado' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Registrar Cambio Postural</h1>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                Directrices SEGG
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Los cambios posturales deben realizarse cada 2 horas durante el día
                (06:00-22:00) y 3 veces durante la noche (22:00-06:00) para prevenir
                úlceras por presión.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Posición *
              </label>
              <div className="space-y-2">
                {positionOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="position"
                      value={option.value}
                      checked={position === option.value}
                      onChange={(e) => setPosition(e.target.value as Position)}
                      className="mr-2"
                      required
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Realizado por *
              </label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                placeholder="Nombre del cuidador"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notas adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 min-h-[100px]"
                placeholder="Observaciones sobre el cambio postural..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Registrar Cambio'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/skin-integrity')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
