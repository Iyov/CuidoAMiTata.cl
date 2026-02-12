import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert } from '../components';
import { getIncontinenceManager } from '../services/IncontinenceManager';

export const BathroomVisitScreen: React.FC = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState<boolean | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const manager = getIncontinenceManager();
      const result = await manager.recordBathroomVisit(
        'default-patient',
        new Date(),
        success,
        notes
      );

      if (result.ok) {
        setSuccessMessage('✓ Visita al baño registrada correctamente');
        
        // Resetear formulario
        setSuccess(undefined);
        setNotes('');
        
        // Redirigir después de 2 segundos
        setTimeout(() => navigate('/incontinence'), 2000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al registrar visita al baño');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Registrar Visita al Baño</h1>
          <Button variant="secondary" onClick={() => navigate('/incontinence')}>
            Volver
          </Button>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {successMessage && <Alert type="success" message={successMessage} className="mb-4" />}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resultado de la visita */}
            <div>
              <label className="block text-sm font-medium mb-2">
                ¿La visita fue exitosa?
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="success"
                    value="true"
                    checked={success === true}
                    onChange={() => setSuccess(true)}
                    className="mr-2"
                  />
                  <span>Sí - Visita exitosa</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="success"
                    value="false"
                    checked={success === false}
                    onChange={() => setSuccess(false)}
                    className="mr-2"
                  />
                  <span>No - Sin resultado</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="success"
                    value="undefined"
                    checked={success === undefined}
                    onChange={() => setSuccess(undefined)}
                    className="mr-2"
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
                placeholder="Observaciones sobre la visita..."
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
                {submitting ? 'Guardando...' : 'Registrar Visita'}
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

        {/* Consejos */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            💡 Consejos
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Registra cada visita para identificar patrones</li>
            <li>• Los recordatorios se programan cada 2-3 horas</li>
            <li>• Mantener un horario regular ayuda a prevenir episodios</li>
            <li>• Anota cualquier observación relevante en las notas</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
