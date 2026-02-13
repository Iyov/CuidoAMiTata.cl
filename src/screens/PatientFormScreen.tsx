/**
 * Patient Form Screen
 * Pantalla de agregar/editar perfil de paciente
 * Requisitos: 10.1, 10.4
 */

import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { getPatientManager } from '../services/PatientManager';
import type { Patient, RiskFactor } from '../types/models';
import { Severity, RiskFactorType } from '../types/enums';

interface PatientFormScreenProps {
  patientId?: string; // Si se proporciona, es modo edición
}

export const PatientFormScreen: React.FC<PatientFormScreenProps> = ({ patientId }) => {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
  });
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const patientManager = getPatientManager();
  const isEditMode = !!patientId;

  useEffect(() => {
    if (isEditMode) {
      loadPatient();
    }
  }, [patientId]);

  const loadPatient = async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      const patient = await patientManager.getPatientById(patientId);
      
      if (patient) {
        setFormData({
          name: patient.name,
          dateOfBirth: new Date(patient.dateOfBirth).toISOString().split('T')[0],
        });
        setRiskFactors(patient.riskFactors || []);
      } else {
        setError('Paciente no encontrado');
      }
    } catch (err) {
      setError('Error al cargar datos del paciente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleAddRiskFactor = () => {
    const newRiskFactor: RiskFactor = {
      type: RiskFactorType.MOBILITY_ISSUES,
      severity: Severity.MEDIUM,
      notes: '',
      assessedAt: new Date(),
    };
    setRiskFactors((prev) => [...prev, newRiskFactor]);
  };

  const handleRemoveRiskFactor = (index: number) => {
    setRiskFactors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRiskFactorChange = (
    index: number,
    field: keyof RiskFactor,
    value: any
  ) => {
    setRiskFactors((prev) =>
      prev.map((rf, i) => (i === index ? { ...rf, [field]: value } : rf))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validación
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!formData.dateOfBirth) {
      setError('La fecha de nacimiento es obligatoria');
      return;
    }

    try {
      setLoading(true);

      const patientData: Patient = {
        id: patientId || '',
        name: formData.name.trim(),
        dateOfBirth: new Date(formData.dateOfBirth),
        riskFactors,
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let result;
      if (isEditMode) {
        result = await patientManager.updatePatientProfile(patientData);
      } else {
        result = await patientManager.createPatientProfile(patientData);
      }

      if (result.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.hash = '#/patients';
        }, 1500);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al guardar el paciente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.hash = '#/patients';
  };

  if (loading && isEditMode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando datos del paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
        {isEditMode ? 'Editar Paciente' : 'Agregar Nuevo Paciente'}
      </h1>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          Paciente {isEditMode ? 'actualizado' : 'creado'} exitosamente
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Información Básica
            </h2>
            
            <div className="space-y-4">
              <Input
                label="Nombre completo *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: María García López"
                fullWidth
                required
              />

              <Input
                label="Fecha de nacimiento *"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </div>
          </div>

          {/* Factores de riesgo */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Factores de Riesgo
              </h2>
              <Button
                type="button"
                onClick={handleAddRiskFactor}
                variant="secondary"
                size="sm"
              >
                + Agregar Factor
              </Button>
            </div>

            {riskFactors.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-sm italic">
                No hay factores de riesgo registrados
              </p>
            ) : (
              <div className="space-y-4">
                {riskFactors.map((rf, index) => (
                  <div
                    key={index}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        Factor de Riesgo #{index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleRemoveRiskFactor(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Tipo
                        </label>
                        <select
                          value={rf.type}
                          onChange={(e) =>
                            handleRiskFactorChange(index, 'type', e.target.value)
                          }
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="SEDATIVES">Sedantes</option>
                          <option value="COGNITIVE_IMPAIRMENT">Deterioro Cognitivo</option>
                          <option value="VISION_PROBLEMS">Problemas de Visión</option>
                          <option value="MOBILITY_ISSUES">Problemas de Movilidad</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Severidad
                        </label>
                        <select
                          value={rf.severity}
                          onChange={(e) =>
                            handleRiskFactorChange(index, 'severity', e.target.value)
                          }
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value={Severity.LOW}>Baja</option>
                          <option value={Severity.MEDIUM}>Media</option>
                          <option value={Severity.HIGH}>Alta</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Notas
                        </label>
                        <textarea
                          value={rf.notes}
                          onChange={(e) =>
                            handleRiskFactorChange(index, 'notes', e.target.value)
                          }
                          placeholder="Detalles adicionales sobre este factor de riesgo"
                          rows={2}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              onClick={handleCancel}
              variant="secondary"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Paciente'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
