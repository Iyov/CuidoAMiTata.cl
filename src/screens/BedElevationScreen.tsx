import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert, Input } from '../components';
import { getSkinIntegrityManager } from '../services/SkinIntegrityManager';

export const BedElevationScreen: React.FC = () => {
  const navigate = useNavigate();
  const [degrees, setDegrees] = useState<string>('');
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
      if (!degrees || degrees.trim() === '') {
        setError('Debe ingresar los grados de elevación');
        setLoading(false);
        return;
      }

      const degreesNum = parseFloat(degrees);
      if (isNaN(degreesNum)) {
        setError('Los grados deben ser un número válido');
        setLoading(false);
        return;
      }

      if (degreesNum < 0) {
        setError('Los grados no pueden ser negativos');
        setLoading(false);
        return;
      }

      if (!performedBy.trim()) {
        setError('Debe indicar quién realizó el ajuste');
        setLoading(false);
        return;
      }

      const manager = getSkinIntegrityManager();
      const patientId = 'default-patient'; // TODO: usar paciente seleccionado
      
      const result = await manager.recordBedElevation(
        patientId,
        degreesNum,
        performedBy,
        notes
      );

      if (result.ok) {
        setSuccess('Elevación de cama registrada correctamente');
        setTimeout(() => navigate('/skin-integrity'), 2000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al registrar elevación de cama');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const degreesNum = parseFloat(degrees);
  const showWarning = !isNaN(degreesNum) && degreesNum > 30;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Registrar Elevación de Cama</h1>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        <Card className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Límite de seguridad
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                La elevación de la cama no debe exceder 30 grados según las directrices
                SEGG para prevenir úlceras por presión y complicaciones respiratorias.
              </p>
            </div>
          </div>
        </Card>

        {showWarning && (
          <Card className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700">
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400 text-xl">🚫</span>
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300">
                  Elevación excesiva
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  La elevación ingresada ({degreesNum}°) excede el límite máximo de 30°.
                  Por favor, ajuste la elevación a un valor seguro.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Grados de elevación *"
              type="number"
              value={degrees}
              onChange={(e) => setDegrees(e.target.value)}
              placeholder="Ej: 25"
              min="0"
              max="30"
              step="1"
              required
              helperText="Máximo 30 grados - Requisito 3.3"
            />

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
                placeholder="Motivo del ajuste, observaciones..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading || showWarning}>
                {loading ? 'Guardando...' : 'Registrar Elevación'}
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
