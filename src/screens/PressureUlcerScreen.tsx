import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';
import { Input } from '../components/Input';
import { getSkinIntegrityManager } from '../services/SkinIntegrityManager';
import type { PressureUlcer, Photo } from '../types/models';
import { UlcerGrade, HealingStatus } from '../types/enums';

export const PressureUlcerScreen: React.FC = () => {
  const navigate = useNavigate();
  const [grade, setGrade] = useState<UlcerGrade | ''>('');
  const [location, setLocation] = useState('');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [depth, setDepth] = useState<string>('');
  const [treatment, setTreatment] = useState('');
  const [healingStatus, setHealingStatus] = useState<HealingStatus>(HealingStatus.NEW);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoNotes, setPhotoNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!grade) {
        setError('Debe seleccionar el grado de la úlcera');
        setLoading(false);
        return;
      }

      if (!location.trim()) {
        setError('Debe indicar la ubicación de la úlcera');
        setLoading(false);
        return;
      }

      if (!length || !width) {
        setError('Debe ingresar las dimensiones de la úlcera (largo y ancho)');
        setLoading(false);
        return;
      }

      const lengthNum = parseFloat(length);
      const widthNum = parseFloat(width);
      const depthNum = depth ? parseFloat(depth) : undefined;

      if (isNaN(lengthNum) || isNaN(widthNum) || lengthNum <= 0 || widthNum <= 0) {
        setError('Las dimensiones deben ser números válidos mayores a cero');
        setLoading(false);
        return;
      }

      if (depthNum !== undefined && (isNaN(depthNum) || depthNum < 0)) {
        setError('La profundidad debe ser un número válido mayor o igual a cero');
        setLoading(false);
        return;
      }

      // Crear objeto de foto si se cargó una
      let photo: Photo | undefined;
      if (photoFile) {
        // En una aplicación real, aquí se subiría la foto a un servidor
        // Por ahora, creamos una URL local
        const photoUrl = URL.createObjectURL(photoFile);
        photo = {
          id: `photo-${Date.now()}`,
          url: photoUrl,
          capturedAt: new Date(),
          notes: photoNotes,
        };
      }

      const ulcer: PressureUlcer = {
        id: `ulcer-${Date.now()}`,
        patientId: 'default-patient', // TODO: usar paciente seleccionado
        grade: grade as UlcerGrade,
        location,
        size: {
          length: lengthNum,
          width: widthNum,
          depth: depthNum,
        },
        photos: photo ? [photo] : [],
        treatment,
        assessedAt: new Date(),
        healingStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const manager = getSkinIntegrityManager();
      const result = await manager.recordPressureUlcer(ulcer, photo);

      if (result.ok) {
        setSuccess('Úlcera por presión registrada correctamente');
        setTimeout(() => navigate('/skin-integrity'), 2000);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al registrar úlcera por presión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const gradeOptions = [
    {
      value: UlcerGrade.I,
      label: 'Grado I',
      description: 'Eritema no blanqueable en piel intacta',
    },
    {
      value: UlcerGrade.II,
      label: 'Grado II',
      description: 'Pérdida parcial del grosor de la piel (dermis)',
    },
    {
      value: UlcerGrade.III,
      label: 'Grado III',
      description: 'Pérdida total del grosor de la piel (grasa visible)',
    },
    {
      value: UlcerGrade.IV,
      label: 'Grado IV',
      description: 'Pérdida total del tejido (músculo/hueso expuesto)',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Registrar Úlcera por Presión</h1>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                Clasificación de UPP
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Las úlceras por presión se clasifican en grados I-IV según la profundidad
                del daño tisular. La fotografía con timestamp es importante para
                telemonitorización y seguimiento.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Grado de la úlcera */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Grado de la úlcera *
              </label>
              <div className="space-y-2">
                {gradeOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start p-3 border border-slate-300 dark:border-slate-600 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="radio"
                      name="grade"
                      value={option.value}
                      checked={grade === option.value}
                      onChange={(e) => setGrade(e.target.value as UlcerGrade)}
                      className="mr-3 mt-1"
                      required
                    />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Ubicación */}
            <Input
              label="Ubicación de la úlcera *"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Sacro, Talón derecho, Codo izquierdo"
              required
            />

            {/* Dimensiones */}
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Largo (cm) *"
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="0.0"
                min="0"
                step="0.1"
                required
              />
              <Input
                label="Ancho (cm) *"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="0.0"
                min="0"
                step="0.1"
                required
              />
              <Input
                label="Profundidad (cm)"
                type="number"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                placeholder="0.0"
                min="0"
                step="0.1"
              />
            </div>

            {/* Tratamiento */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tratamiento aplicado
              </label>
              <textarea
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 min-h-[80px]"
                placeholder="Describa el tratamiento aplicado..."
              />
            </div>

            {/* Estado de curación */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Estado de curación
              </label>
              <select
                value={healingStatus}
                onChange={(e) => setHealingStatus(e.target.value as HealingStatus)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
              >
                <option value={HealingStatus.NEW}>Nueva</option>
                <option value={HealingStatus.IMPROVING}>Mejorando</option>
                <option value={HealingStatus.STABLE}>Estable</option>
                <option value={HealingStatus.WORSENING}>Empeorando</option>
              </select>
            </div>

            {/* Fotografía */}
            <div className="border-t border-slate-300 dark:border-slate-600 pt-4">
              <label className="block text-sm font-medium mb-2">
                Fotografía para telemonitorización
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
              />
              {photoFile && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  ✓ Archivo seleccionado: {photoFile.name}
                </p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                La fotografía se registrará con timestamp automático - Requisito 3.6
              </p>

              {photoFile && (
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-2">
                    Notas de la fotografía
                  </label>
                  <textarea
                    value={photoNotes}
                    onChange={(e) => setPhotoNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 min-h-[60px]"
                    placeholder="Observaciones sobre la fotografía..."
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Registrar Úlcera'}
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
