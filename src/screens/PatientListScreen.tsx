/**
 * Patient List Screen
 * Pantalla de lista de pacientes con indicadores de alertas
 * Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { getPatientManager } from '../services/PatientManager';
import type { Patient, RiskAlert } from '../types/models';

export const PatientListScreen: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientAlerts, setPatientAlerts] = useState<Map<string, RiskAlert[]>>(new Map());
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const patientManager = getPatientManager();

  useEffect(() => {
    loadPatients();
    setCurrentPatientId(patientManager.getCurrentPatientId());
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar todos los pacientes
      const allPatients = await patientManager.getAllPatients();
      setPatients(allPatients);

      // Cargar alertas para cada paciente
      const alertsMap = new Map<string, RiskAlert[]>();
      for (const patient of allPatients) {
        const alerts = await patientManager.getPatientAlerts(patient.id);
        alertsMap.set(patient.id, alerts);
      }
      setPatientAlerts(alertsMap);
    } catch (err) {
      setError('Error al cargar la lista de pacientes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = async (patientId: string) => {
    try {
      const result = await patientManager.selectPatient(patientId);
      if (result.ok) {
        setCurrentPatientId(patientId);
        // Emitir evento para que otros componentes se actualicen
        window.dispatchEvent(new CustomEvent('patient-changed', { detail: { patientId } }));
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al seleccionar paciente');
      console.error(err);
    }
  };

  const handleAddPatient = () => {
    // Navegar a pantalla de agregar paciente
    window.location.hash = '#/patients/new';
  };

  const handleEditPatient = (patientId: string) => {
    // Navegar a pantalla de editar paciente
    window.location.hash = `#/patients/${patientId}/edit`;
  };

  const getAlertCount = (patientId: string): number => {
    return patientAlerts.get(patientId)?.length || 0;
  };

  const getAlertBadgeColor = (count: number): string => {
    if (count === 0) return 'bg-slate-300 dark:bg-slate-600';
    if (count <= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Gestión de Pacientes
        </h1>
        <Button onClick={handleAddPatient} variant="primary">
          + Agregar Paciente
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {patients.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No hay pacientes registrados
            </p>
            <Button onClick={handleAddPatient} variant="primary">
              Agregar Primer Paciente
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {patients.map((patient) => {
            const alertCount = getAlertCount(patient.id);
            const isSelected = patient.id === currentPatientId;

            return (
              <Card
                key={patient.id}
                className={`transition-all ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 shadow-lg'
                    : 'hover:shadow-lg'
                }`}
                padding="md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {patient.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Información del paciente */}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {patient.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Fecha de nacimiento:{' '}
                        {new Date(patient.dateOfBirth).toLocaleDateString('es-ES')}
                      </p>
                      {patient.riskFactors.length > 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Factores de riesgo: {patient.riskFactors.length}
                        </p>
                      )}
                    </div>

                    {/* Indicador de alertas */}
                    {alertCount > 0 && (
                      <div className="flex items-center space-x-2">
                        <div
                          className={`${getAlertBadgeColor(
                            alertCount
                          )} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm`}
                        >
                          {alertCount}
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {alertCount === 1 ? 'alerta' : 'alertas'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center space-x-2 ml-4">
                    {!isSelected && (
                      <Button
                        onClick={() => handleSelectPatient(patient.id)}
                        variant="primary"
                        size="sm"
                      >
                        Seleccionar
                      </Button>
                    )}
                    {isSelected && (
                      <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">
                        Activo
                      </span>
                    )}
                    <Button
                      onClick={() => handleEditPatient(patient.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Editar
                    </Button>
                  </div>
                </div>

                {/* Mostrar alertas si las hay */}
                {alertCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Alertas Activas:
                    </h4>
                    <div className="space-y-2">
                      {patientAlerts.get(patient.id)?.slice(0, 3).map((alert) => (
                        <div
                          key={alert.id}
                          className="text-sm text-slate-600 dark:text-slate-400 flex items-start"
                        >
                          <span className="text-yellow-500 mr-2">⚠</span>
                          <span>{alert.message}</span>
                        </div>
                      ))}
                      {alertCount > 3 && (
                        <p className="text-sm text-slate-500 dark:text-slate-500 italic">
                          + {alertCount - 3} alertas más
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Selector rápido de paciente (barra flotante) */}
      {patients.length > 1 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 px-4 py-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Cambio rápido:
            </span>
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  patient.id === currentPatientId
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
                title={patient.name}
              >
                {patient.name.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
