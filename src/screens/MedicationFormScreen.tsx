import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Card, Alert } from '../components';
import { getMedicationManager } from '../services/MedicationManager';
import type { Medication, Schedule } from '../types/models';
import { ScheduleFrequency } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';

export const MedicationFormScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [purpose, setPurpose] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [stockLevel, setStockLevel] = useState(30);
  const [expirationDate, setExpirationDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadMedication();
    }
  }, [id]);

  const loadMedication = async () => {
    try {
      const med = await IndexedDBUtils.getById<Medication>(
        IndexedDBUtils.STORES.MEDICATIONS,
        id!
      );
      if (med) {
        setName(med.name);
        setDosage(med.dosage);
        setPurpose(med.purpose);
        setStockLevel(med.stockLevel);
        setExpirationDate(new Date(med.expirationDate).toISOString().split('T')[0]);
        
        // Convertir horarios a strings
        const timeStrings = med.schedule.times.map((t) =>
          new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        );
        setTimes(timeStrings);
      }
    } catch (err) {
      setError('Error al cargar medicamento');
      console.error(err);
    }
  };

  const handleAddTime = () => {
    setTimes([...times, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    setTimes(times.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validar campos
      if (!name || !dosage || !purpose || !expirationDate) {
        setError('Todos los campos son obligatorios');
        setLoading(false);
        return;
      }

      if (times.length === 0) {
        setError('Debe agregar al menos un horario');
        setLoading(false);
        return;
      }

      // Convertir horarios a Date
      const today = new Date();
      const scheduleTimes = times.map((timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date(today);
        date.setHours(hours, minutes, 0, 0);
        return date;
      });

      const schedule: Schedule = {
        times: scheduleTimes,
        frequency: ScheduleFrequency.DAILY,
      };

      const medication: Medication = {
        id: isEdit ? id! : `med-${Date.now()}`,
        patientId: 'default-patient', // TODO: usar paciente seleccionado
        name,
        dosage,
        purpose,
        schedule,
        stockLevel,
        expirationDate: new Date(expirationDate),
        isActive: true,
        createdAt: isEdit ? (await IndexedDBUtils.getById<Medication>(IndexedDBUtils.STORES.MEDICATIONS, id!))!.createdAt : new Date(),
      };

      const manager = getMedicationManager();
      const result = await manager.scheduleMedication(medication, schedule);

      if (result.ok) {
        navigate('/medications');
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al guardar medicamento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? 'Editar Medicamento' : 'Agregar Medicamento'}
        </h1>

        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre del medicamento"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Aspirina"
              required
            />

            <Input
              label="Dosis"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Ej: 100mg"
              required
            />

            <Input
              label="Propósito"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Ej: Anticoagulante"
              required
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                Horarios de administración
              </label>
              {times.map((time, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                    required
                  />
                  {times.length > 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRemoveTime(index)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddTime}
              >
                Agregar Horario
              </Button>
            </div>

            <Input
              label="Stock disponible (días)"
              type="number"
              value={stockLevel}
              onChange={(e) => setStockLevel(Number(e.target.value))}
              min="0"
              required
            />

            <Input
              label="Fecha de caducidad"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/medications')}
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
