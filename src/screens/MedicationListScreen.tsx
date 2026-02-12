import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert } from '../components';
import { getMedicationManager } from '../services/MedicationManager';
import type { Medication, MedicationEvent } from '../types/models';
import { MedicationEventStatus } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';

export const MedicationListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Map<string, MedicationEvent>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const manager = getMedicationManager();
      const sheet = await manager.getMedicationSheet();
      setMedications(sheet.medications);

      // Cargar eventos pendientes
      const events = await IndexedDBUtils.getAll<MedicationEvent>(
        IndexedDBUtils.STORES.MEDICATION_EVENTS
      );
      const pending = new Map<string, MedicationEvent>();
      events
        .filter((e) => e.status === MedicationEventStatus.PENDING)
        .forEach((e) => {
          if (!pending.has(e.medicationId) || e.scheduledTime < pending.get(e.medicationId)!.scheduledTime) {
            pending.set(e.medicationId, e);
          }
        });
      setPendingEvents(pending);
    } catch (err) {
      setError('Error al cargar medicamentos');
      console.error(err);
    } finally {
      setLoading(false);
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
        <p className="text-center mt-8">Cargando medicamentos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Medicamentos</h1>
          <Button onClick={() => navigate('/medications/add')}>
            Agregar Medicamento
          </Button>
        </div>

        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        {medications.length === 0 ? (
          <Card>
            <p className="text-center text-slate-600 dark:text-slate-400">
              No hay medicamentos registrados
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {medications.map((med) => {
              const pendingEvent = pendingEvents.get(med.id);
              const hasPending = !!pendingEvent;

              return (
                <Card key={med.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{med.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Dosis: {med.dosage}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Propósito: {med.purpose}
                      </p>
                      {hasPending && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                          ⏰ Próxima dosis: {formatTime(pendingEvent.scheduledTime)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {hasPending && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/medications/${med.id}/confirm`)}
                        >
                          Confirmar Dosis
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/medications/${med.id}/edit`)}
                      >
                        Editar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
