import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { getBitacoraManager } from '../services/BitacoraManager';
import type { BitacoraEntry, BitacoraEntryInput, MoodType } from '../types/models';

/**
 * BitacoraScreen
 * Pantalla principal de bitácora diaria
 * Permite registrar comidas, ánimo y actividades del paciente
 */
export const BitacoraScreen: React.FC = () => {
  const navigate = useNavigate();
  const manager = getBitacoraManager();
  
  // Estado del formulario
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [snacks, setSnacks] = useState('');
  const [mood, setMood] = useState<MoodType | ''>('');
  const [moodNotes, setMoodNotes] = useState('');
  const [activities, setActivities] = useState('');
  const [activityNotes, setActivityNotes] = useState('');
  
  // Estado de la UI
  const [entries, setEntries] = useState<BitacoraEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<BitacoraEntry | null>(null);
  
  // TODO: Obtener patientId del contexto de familia/paciente
  // Por ahora usamos un ID de prueba
  const patientId = 'test-patient-id';
  const userId = localStorage.getItem('user_id') || 'test-user-id';

  useEffect(() => {
    loadEntries();
  }, [selectedDate]);

  /**
   * Carga las entradas de bitácora para la fecha seleccionada
   */
  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const date = new Date(selectedDate);
      const result = await manager.getEntriesByDate(patientId, date);
      
      if (result.ok) {
        // Ordenar por fecha descendente (más reciente primero)
        const sortedEntries = result.value.sort((a, b) => 
          new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
        );
        setEntries(sortedEntries);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al cargar entradas de bitácora');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const entryInput: BitacoraEntryInput = {
        patientId,
        entryDate: new Date(selectedDate),
        breakfast: breakfast.trim() || undefined,
        lunch: lunch.trim() || undefined,
        dinner: dinner.trim() || undefined,
        snacks: snacks.trim() || undefined,
        mood: mood || undefined,
        moodNotes: moodNotes.trim() || undefined,
        activities: activities.trim() ? activities.split(',').map(a => a.trim()).filter(Boolean) : undefined,
        activityNotes: activityNotes.trim() || undefined,
      };
      
      let result;
      if (editingEntry) {
        result = await manager.updateEntry(editingEntry.id, entryInput);
      } else {
        result = await manager.createEntry(entryInput);
      }
      
      if (result.ok) {
        setSuccess(editingEntry ? 'Entrada actualizada exitosamente' : 'Entrada creada exitosamente');
        clearForm();
        await loadEntries();
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al guardar entrada de bitácora');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Limpia el formulario
   */
  const clearForm = () => {
    setBreakfast('');
    setLunch('');
    setDinner('');
    setSnacks('');
    setMood('');
    setMoodNotes('');
    setActivities('');
    setActivityNotes('');
    setEditingEntry(null);
  };

  /**
   * Carga una entrada en el formulario para edición
   */
  const handleEdit = (entry: BitacoraEntry) => {
    if (!manager.canEdit(entry, userId)) {
      setError('Solo puede editar entradas creadas en las últimas 24 horas');
      return;
    }
    
    setEditingEntry(entry);
    setBreakfast(entry.breakfast || '');
    setLunch(entry.lunch || '');
    setDinner(entry.dinner || '');
    setSnacks(entry.snacks || '');
    setMood(entry.mood || '');
    setMoodNotes(entry.moodNotes || '');
    setActivities(entry.activities?.join(', ') || '');
    setActivityNotes(entry.activityNotes || '');
    
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Formatea la fecha en formato chileno (DD/MM/YYYY)
   */
  const formatDateChilean = (date: Date): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /**
   * Formatea el ánimo para mostrar
   */
  const formatMood = (moodValue?: MoodType): string => {
    if (!moodValue) return '-';
    const moodLabels: Record<MoodType, string> = {
      bien: '😊 Bien',
      regular: '😐 Regular',
      bajo: '😔 Bajo',
      irritable: '😠 Irritable',
      otro: '🤔 Otro',
    };
    return moodLabels[moodValue];
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Bitácora Diaria</h1>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Volver
          </Button>
        </div>

        {/* Alertas */}
        {error && (
          <Alert type="error" message={error} className="mb-4" onClose={() => setError(null)} />
        )}
        {success && (
          <Alert type="success" message={success} className="mb-4" onClose={() => setSuccess(null)} />
        )}

        {/* Formulario */}
        <Card title={editingEntry ? 'Editar Entrada' : 'Nueva Entrada'} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de fecha */}
            <Input
              type="date"
              label="Fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              fullWidth
              required
            />

            {/* Comidas */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                Comidas
              </h3>
              <Input
                label="Desayuno"
                value={breakfast}
                onChange={(e) => setBreakfast(e.target.value)}
                placeholder="Ej: Pan con palta, té"
                fullWidth
              />
              <Input
                label="Almuerzo"
                value={lunch}
                onChange={(e) => setLunch(e.target.value)}
                placeholder="Ej: Cazuela de pollo, ensalada"
                fullWidth
              />
              <Input
                label="Cena"
                value={dinner}
                onChange={(e) => setDinner(e.target.value)}
                placeholder="Ej: Sopa de verduras, pan"
                fullWidth
              />
              <Input
                label="Colaciones"
                value={snacks}
                onChange={(e) => setSnacks(e.target.value)}
                placeholder="Ej: Fruta, galletas"
                fullWidth
              />
            </div>

            {/* Ánimo */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                Ánimo
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estado de ánimo
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value as MoodType | '')}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-h-[44px]"
                >
                  <option value="">Seleccionar...</option>
                  <option value="bien">😊 Bien</option>
                  <option value="regular">😐 Regular</option>
                  <option value="bajo">😔 Bajo</option>
                  <option value="irritable">😠 Irritable</option>
                  <option value="otro">🤔 Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notas sobre el ánimo
                </label>
                <textarea
                  value={moodNotes}
                  onChange={(e) => setMoodNotes(e.target.value)}
                  placeholder="Observaciones adicionales sobre el ánimo..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                />
              </div>
            </div>

            {/* Actividades */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                Actividades
              </h3>
              <Input
                label="Actividades realizadas"
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                placeholder="Ej: Paseo, visita familiar, terapia (separar con comas)"
                helperText="Separar múltiples actividades con comas"
                fullWidth
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notas sobre actividades
                </label>
                <textarea
                  value={activityNotes}
                  onChange={(e) => setActivityNotes(e.target.value)}
                  placeholder="Observaciones adicionales sobre las actividades..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Guardando...' : editingEntry ? 'Actualizar Entrada' : 'Guardar Entrada'}
              </Button>
              {editingEntry && (
                <Button type="button" variant="secondary" onClick={clearForm} fullWidth>
                  Cancelar Edición
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Lista de entradas históricas */}
        <Card title="Entradas Anteriores">
          {loading && entries.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400">
              Cargando entradas...
            </p>
          ) : entries.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400">
              No hay entradas para esta fecha
            </p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => {
                const canEdit = manager.canEdit(entry, userId);
                
                return (
                  <div
                    key={entry.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatDateChilean(entry.entryDate)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Registrado: {formatDateChilean(entry.createdAt)}
                        </p>
                      </div>
                      {canEdit && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                        >
                          Editar
                        </Button>
                      )}
                    </div>

                    {/* Comidas */}
                    {(entry.breakfast || entry.lunch || entry.dinner || entry.snacks) && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Comidas
                        </h4>
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          {entry.breakfast && <p>• Desayuno: {entry.breakfast}</p>}
                          {entry.lunch && <p>• Almuerzo: {entry.lunch}</p>}
                          {entry.dinner && <p>• Cena: {entry.dinner}</p>}
                          {entry.snacks && <p>• Colaciones: {entry.snacks}</p>}
                        </div>
                      </div>
                    )}

                    {/* Ánimo */}
                    {(entry.mood || entry.moodNotes) && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ánimo
                        </h4>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          <p>{formatMood(entry.mood)}</p>
                          {entry.moodNotes && <p className="mt-1">{entry.moodNotes}</p>}
                        </div>
                      </div>
                    )}

                    {/* Actividades */}
                    {(entry.activities || entry.activityNotes) && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Actividades
                        </h4>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {entry.activities && entry.activities.length > 0 && (
                            <p>• {entry.activities.join(', ')}</p>
                          )}
                          {entry.activityNotes && <p className="mt-1">{entry.activityNotes}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
