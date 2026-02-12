import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Alert } from '../components';
import { getMedicationManager } from '../services/MedicationManager';
import type { Medication, MedicationEvent } from '../types/models';
import { MedicationEventStatus } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';

export const MedicationConfirmScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [medication, setMedication] = useState<Medication | null>(null);
  const [pendingEvent, setPendingEvent] = useState<MedicationEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOmitModal, setShowOmitModal] = useState(false);

  useEffect(() => {
    loadMedicationData();
  }, [id]);

  const loadMedicationData = async () => {
    try {
      const med = await IndexedDBUtils.getById<Medication>(
        IndexedDBUtils.STORES.MEDICATIONS,
        id!
      );
      if (!med) {
        setError('Medicamento no encontrado');
        return;
      }
      setMedication(med);

      // Buscar evento pendiente más cercano
      const events = await IndexedDBUtils.getByIndex<MedicationEvent>(
        IndexedDBUtils.STORES.MEDICATION_EVENTS,
        'medicationId',
        id!
      );
      const pending = events
        .filter((e) => e.status === MedicationEventStatus.PENDING)
        .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())[0];

      if (pending) {
        setPendingEvent(pending);
      } else {
        setError('No hay dosis pendientes para este medicamento');
      }
    } catch (err) {
      setError('Error al cargar datos del medicamento');
      console.error(err);
    }
  };

  const handleConfirm = async () => {
    if (!medication || !pendingEvent) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const manager = getMedicationManager();
      const now = new Date();
      const result = await manager.confirmAdministration(medication.id, now);

      if (result.ok) {
        // Emitir alerta dual (audio + visual)
        playDualAlert();
        setSuccess('Dosis confirmada correctamente');
        setTimeout(() => navigate('/medications'), 2000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al confirmar administración');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playDualAlert = () => {
    // Alerta visual (ya mostrada con el mensaje de éxito)
    // Alerta auditiva
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    } catch (err) {
      console.error('Error al reproducir alerta auditiva:', err);
    }
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAdherenceWindowInfo = () => {
    if (!pendingEvent) return null;

    const scheduled = new Date(pendingEvent.scheduledTime);
    const now = new Date();
    const diffMinutes = Math.abs(now.getTime() - scheduled.getTime()) / (1000 * 60);
    const windowMinutes = 90; // 1.5 horas = 90 minutos

    const isWithinWindow = diffMinutes <= windowMinutes;
    const remainingMinutes = windowMinutes - diffMinutes;

    return {
      isWithinWindow,
      remainingMinutes: Math.max(0, remainingMinutes),
      diffMinutes,
    };
  };

  const windowInfo = getAdherenceWindowInfo();

  if (!medication || !pendingEvent) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <div className="max-w-2xl mx-auto">
          {error && <Alert type="error" message={error} />}
          <Button onClick={() => navigate('/medications')} className="mt-4">
            Volver a Medicamentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Confirmar Administración</h1>

        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        {success && (
          <Alert type="success" message={success} className="mb-4" />
        )}

        <Card className="mb-4">
          <h2 className="text-xl font-semibold mb-4">{medication.name}</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Dosis:</span> {medication.dosage}
            </p>
            <p>
              <span className="font-medium">Propósito:</span> {medication.purpose}
            </p>
            <p>
              <span className="font-medium">Hora programada:</span>{' '}
              {formatDateTime(pendingEvent.scheduledTime)}
            </p>
          </div>
        </Card>

        {windowInfo && (
          <Card className={`mb-4 ${windowInfo.isWithinWindow ? 'border-green-500' : 'border-red-500'}`}>
            <h3 className="font-semibold mb-2">Ventana de Adherencia</h3>
            {windowInfo.isWithinWindow ? (
              <p className="text-green-600 dark:text-green-400">
                ✓ Dentro de la ventana de 3 horas
                <br />
                <span className="text-sm">
                  Tiempo restante: {Math.floor(windowInfo.remainingMinutes)} minutos
                </span>
              </p>
            ) : (
              <p className="text-red-600 dark:text-red-400">
                ✗ Fuera de la ventana de adherencia
                <br />
                <span className="text-sm">
                  La administración debe ocurrir dentro de 3 horas del horario programado
                </span>
              </p>
            )}
          </Card>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleConfirm}
            disabled={loading || !windowInfo?.isWithinWindow}
            className="flex-1"
          >
            {loading ? 'Confirmando...' : 'Confirmar Administración'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowOmitModal(true)}
            className="flex-1"
          >
            Omitir Dosis
          </Button>
        </div>

        <Button
          variant="secondary"
          onClick={() => navigate('/medications')}
          className="w-full mt-4"
        >
          Cancelar
        </Button>

        {showOmitModal && (
          <OmitDoseModal
            medication={medication}
            onClose={() => setShowOmitModal(false)}
            onSuccess={() => {
              setShowOmitModal(false);
              navigate('/medications');
            }}
          />
        )}
      </div>
    </div>
  );
};

interface OmitDoseModalProps {
  medication: Medication;
  onClose: () => void;
  onSuccess: () => void;
}

const OmitDoseModal: React.FC<OmitDoseModalProps> = ({ medication, onClose, onSuccess }) => {
  const [justification, setJustification] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!justification.trim()) {
      setError('La justificación es obligatoria para omitir una dosis');
      return;
    }

    setLoading(true);

    try {
      const manager = getMedicationManager();
      const result = await manager.omitDose(medication.id, justification, new Date());

      if (result.ok) {
        onSuccess();
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al registrar omisión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Omitir Dosis</h2>

        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Justificación (obligatoria) *
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 min-h-[100px]"
              placeholder="Explique por qué se omite esta dosis..."
              required
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Requisito 1.5: Debe proporcionar una justificación para omitir esta dosis
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Guardando...' : 'Confirmar Omisión'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
