import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Alert } from '../components';
import type { RiskChecklist, FallIncident, Patient } from '../types/models';
import { RiskFactorType, Severity } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';

export const FallPreventionScreen: React.FC = () => {
  const navigate = useNavigate();
  const [recentChecklists, setRecentChecklists] = useState<RiskChecklist[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<FallIncident[]>([]);
  const [hasRiskFactors, setHasRiskFactors] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar listas de verificación recientes
      const checklists = await IndexedDBUtils.getAll<RiskChecklist>(
        IndexedDBUtils.STORES.RISK_CHECKLISTS
      );
      const sortedChecklists = checklists
        .sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime())
        .slice(0, 5);
      setRecentChecklists(sortedChecklists);

      // Cargar incidentes recientes
      const incidents = await IndexedDBUtils.getAll<FallIncident>(
        IndexedDBUtils.STORES.FALL_INCIDENTS
      );
      const sortedIncidents = incidents
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 5);
      setRecentIncidents(sortedIncidents);

      // Verificar si el paciente tiene factores de riesgo
      // TODO: Cargar paciente actual
      const mockPatient: Patient = {
        id: 'default-patient',
        name: 'Paciente de Ejemplo',
        dateOfBirth: new Date('1940-01-01'),
        riskFactors: [
          {
            type: RiskFactorType.SEDATIVES,
            severity: Severity.HIGH,
            notes: 'Toma sedantes para dormir',
            assessedAt: new Date(),
          },
        ],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setHasRiskFactors(mockPatient.riskFactors.length > 0);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <p className="text-center mt-8">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Prevención de Caídas</h1>

        {/* Alerta de factores de riesgo */}
        {hasRiskFactors && (
          <Alert
            type="warning"
            message="Este paciente tiene factores de riesgo de caídas. Revise las alertas activas."
            className="mb-6"
          />
        )}

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <button
              onClick={() => navigate('/fall-prevention/checklist')}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">✓</span>
                <h3 className="font-semibold">Lista de Verificación</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Evaluar iluminación, suelos y calzado
              </p>
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <button
              onClick={() => navigate('/fall-prevention/incident')}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">⚠️</span>
                <h3 className="font-semibold">Registrar Caída</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Documentar incidente con tiempo en el suelo
              </p>
            </button>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <button
              onClick={() => navigate('/fall-prevention/alerts')}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🔔</span>
                <h3 className="font-semibold">Alertas de Riesgo</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ver factores de riesgo y puntuación
              </p>
            </button>
          </Card>
        </div>

        {/* Listas de verificación recientes */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Verificaciones Recientes</h2>
          {recentChecklists.length === 0 ? (
            <Card>
              <p className="text-center text-slate-600 dark:text-slate-400">
                No hay verificaciones registradas
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentChecklists.map((checklist) => (
                <Card key={checklist.id} className="hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{formatDate(checklist.checkDate)}</p>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                        <p>Iluminación: {checklist.lighting}</p>
                        <p>Suelos: {checklist.flooring}</p>
                        <p>Calzado: {checklist.footwear}</p>
                      </div>
                      {checklist.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                          {checklist.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {checklist.completedBy}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Incidentes recientes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Incidentes Recientes</h2>
          {recentIncidents.length === 0 ? (
            <Card>
              <p className="text-center text-slate-600 dark:text-slate-400">
                No hay incidentes registrados
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <Card
                  key={incident.id}
                  className="hover:shadow-md transition-shadow border-l-4 border-red-500"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{formatDateTime(incident.occurredAt)}</p>
                      <span className="text-sm px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                        Tiempo en suelo: {incident.timeOnFloor} min
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <p>
                        <span className="font-medium">Ubicación:</span> {incident.location}
                      </p>
                      <p>
                        <span className="font-medium">Circunstancias:</span> {incident.circumstances}
                      </p>
                      {incident.injuries.length > 0 && (
                        <p>
                          <span className="font-medium">Lesiones:</span>{' '}
                          {incident.injuries.join(', ')}
                        </p>
                      )}
                      <p className="text-xs mt-2">
                        Reportado por: {incident.reportedBy}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
