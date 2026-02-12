import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert } from '../components';
import { getFallPreventionManager } from '../services/FallPreventionManager';
import type { RiskChecklist } from '../types/models';
import { RiskChecklistStatus } from '../types/enums';

export const FallPreventionChecklistScreen: React.FC = () => {
  const navigate = useNavigate();
  const [lighting, setLighting] = useState<RiskChecklistStatus | ''>('');
  const [flooring, setFlooring] = useState<RiskChecklistStatus | ''>('');
  const [footwear, setFootwear] = useState<RiskChecklistStatus | ''>('');
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
      // Validar campos
      if (!lighting || !flooring || !footwear) {
        setError('Todos los campos de evaluación son obligatorios');
        setLoading(false);
        return;
      }

      const checklist: RiskChecklist = {
        id: `checklist-${Date.now()}`,
        patientId: 'default-patient', // TODO: usar paciente seleccionado
        checkDate: new Date(),
        lighting: lighting as RiskChecklistStatus,
        flooring: flooring as RiskChecklistStatus,
        footwear: footwear as RiskChecklistStatus,
        notes,
        completedBy: 'Cuidador Principal', // TODO: usar usuario actual
        createdAt: new Date(),
      };

      const manager = getFallPreventionManager();
      const result = await manager.submitDailyChecklist(checklist);

      if (result.ok) {
        setSuccess('Lista de verificación guardada correctamente');
        setTimeout(() => navigate('/fall-prevention'), 2000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al guardar la lista de verificación');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Lista de Verificación Diaria</h1>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Iluminación */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Iluminación *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="lighting"
                    value={RiskChecklistStatus.ADEQUATE}
                    checked={lighting === RiskChecklistStatus.ADEQUATE}
                    onChange={(e) => setLighting(e.target.value as RiskChecklistStatus)}
                    className="mr-2"
                    required
                  />
                  <span>Adecuada - Buena iluminación en todas las áreas</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="lighting"
                    value={RiskChecklistStatus.INADEQUATE}
                    checked={lighting === RiskChecklistStatus.INADEQUATE}
                    onChange={(e) => setLighting(e.target.value as RiskChecklistStatus)}
                    className="mr-2"
                  />
                  <span className="text-amber-600 dark:text-amber-400">
                    Inadecuada - Iluminación insuficiente o zonas oscuras
                  </span>
                </label>
              </div>
            </div>

            {/* Suelos */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Suelos *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="flooring"
                    value={RiskChecklistStatus.SAFE}
                    checked={flooring === RiskChecklistStatus.SAFE}
                    onChange={(e) => setFlooring(e.target.value as RiskChecklistStatus)}
                    className="mr-2"
                    required
                  />
                  <span>Seguros - Sin obstáculos, secos y estables</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="flooring"
                    value={RiskChecklistStatus.HAZARDOUS}
                    checked={flooring === RiskChecklistStatus.HAZARDOUS}
                    onChange={(e) => setFlooring(e.target.value as RiskChecklistStatus)}
                    className="mr-2"
                  />
                  <span className="text-red-600 dark:text-red-400">
                    Peligrosos - Alfombras sueltas, superficies mojadas u obstáculos
                  </span>
                </label>
              </div>
            </div>

            {/* Calzado */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Calzado *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="footwear"
                    value={RiskChecklistStatus.APPROPRIATE}
                    checked={footwear === RiskChecklistStatus.APPROPRIATE}
                    onChange={(e) => setFootwear(e.target.value as RiskChecklistStatus)}
                    className="mr-2"
                    required
                  />
                  <span>Apropiado - Calzado cerrado con suela antideslizante</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="footwear"
                    value={RiskChecklistStatus.INAPPROPRIATE}
                    checked={footwear === RiskChecklistStatus.INAPPROPRIATE}
                    onChange={(e) => setFootwear(e.target.value as RiskChecklistStatus)}
                    className="mr-2"
                  />
                  <span className="text-amber-600 dark:text-amber-400">
                    Inapropiado - Pantuflas resbaladizas, calcetines o descalzo
                  </span>
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
                placeholder="Observaciones adicionales sobre riesgos detectados..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Verificación'}
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
