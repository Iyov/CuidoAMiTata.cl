import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert, Input } from '../components';
import { getFallPreventionManager } from '../services/FallPreventionManager';
import type { FallIncident } from '../types/models';

export const FallIncidentScreen: React.FC = () => {
  const navigate = useNavigate();
  const [timeOnFloor, setTimeOnFloor] = useState<string>('');
  const [location, setLocation] = useState('');
  const [circumstances, setCircumstances] = useState('');
  const [injuries, setInjuries] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Validar campo obligatorio: tiempo en el suelo
      if (!timeOnFloor || timeOnFloor.trim() === '') {
        setError('El tiempo en el suelo es un campo obligatorio');
        setLoading(false);
        return;
      }

      const timeOnFloorNum = parseFloat(timeOnFloor);
      if (isNaN(timeOnFloorNum) || timeOnFloorNum < 0) {
        setError('El tiempo en el suelo debe ser un número válido mayor o igual a cero');
        setLoading(false);
        return;
      }

      if (!location || !circumstances) {
        setError('Todos los campos son obligatorios');
        setLoading(false);
        return;
      }

      const incident: FallIncident = {
        id: `incident-${Date.now()}`,
        patientId: 'default-patient', // TODO: usar paciente seleccionado
        occurredAt: new Date(),
        timeOnFloor: timeOnFloorNum,
        location,
        circumstances,
        injuries: injuries ? injuries.split(',').map((i) => i.trim()) : [],
        reportedBy: 'Cuidador Principal', // TODO: usar usuario actual
        createdAt: new Date(),
      };

      const manager = getFallPreventionManager();
      const result = await manager.recordFallIncident(incident);

      if (result.ok) {
        setSuccess('Incidente de caída registrado correctamente');
        setTimeout(() => navigate('/fall-prevention'), 2000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al registrar el incidente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Registrar Incidente de Caída</h1>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        <Card className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Información importante
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                El campo "tiempo en el suelo" es obligatorio según las directrices SEGG.
                Este dato es crítico para evaluar la gravedad del incidente.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tiempo en el suelo (minutos) *"
              type="number"
              value={timeOnFloor}
              onChange={(e) => setTimeOnFloor(e.target.value)}
              placeholder="Ej: 15"
              min="0"
              step="0.1"
              required
              helperText="Campo obligatorio - Requisito 2.3"
            />

            <Input
              label="Ubicación de la caída *"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Baño, Dormitorio, Pasillo"
              required
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                Circunstancias de la caída *
              </label>
              <textarea
                value={circumstances}
                onChange={(e) => setCircumstances(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 min-h-[100px]"
                placeholder="Describa cómo ocurrió la caída..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Lesiones (separadas por comas)
              </label>
              <textarea
                value={injuries}
                onChange={(e) => setInjuries(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 min-h-[80px]"
                placeholder="Ej: Contusión en rodilla derecha, Hematoma en brazo"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Deje en blanco si no hubo lesiones
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Registrar Incidente'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/fall-prevention')}
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
