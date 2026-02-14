import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';
import { getFallPreventionManager } from '../services/FallPreventionManager';
import type { Patient, RiskAlert, RiskScore } from '../types/models';
import { RiskFactorType, Severity } from '../types/enums';

export const FallRiskAlertsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatientAndAlerts();
  }, []);

  const loadPatientAndAlerts = async () => {
    try {
      setLoading(true);
      
      // TODO: Cargar paciente seleccionado actual
      // Por ahora, crear un paciente de ejemplo con factores de riesgo
      const currentPatient: Patient = {
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
          {
            type: RiskFactorType.COGNITIVE_IMPAIRMENT,
            severity: Severity.MEDIUM,
            notes: 'Deterioro cognitivo leve',
            assessedAt: new Date(),
          },
          {
            type: RiskFactorType.VISION_PROBLEMS,
            severity: Severity.MEDIUM,
            notes: 'Cataratas en ambos ojos',
            assessedAt: new Date(),
          },
        ],
        medications: [],
        careHistory: [],
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const manager = getFallPreventionManager();
      
      // Obtener alertas de riesgo
      const riskAlerts = await manager.getRiskAlerts(currentPatient);
      setAlerts(riskAlerts);

      // Calcular puntuación de riesgo
      const score = manager.calculateRiskScore(currentPatient);
      setRiskScore(score);
    } catch (err) {
      setError('Error al cargar alertas de riesgo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskFactorLabel = (type: RiskFactorType): string => {
    switch (type) {
      case RiskFactorType.SEDATIVES:
        return 'Sedantes';
      case RiskFactorType.COGNITIVE_IMPAIRMENT:
        return 'Deterioro Cognitivo';
      case RiskFactorType.VISION_PROBLEMS:
        return 'Problemas de Visión';
      case RiskFactorType.MOBILITY_ISSUES:
        return 'Problemas de Movilidad';
      default:
        return type;
    }
  };

  const getSeverityColor = (severity: Severity): string => {
    switch (severity) {
      case Severity.HIGH:
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
      case Severity.MEDIUM:
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700';
      case Severity.LOW:
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getSeverityLabel = (severity: Severity): string => {
    switch (severity) {
      case Severity.HIGH:
        return 'Alto';
      case Severity.MEDIUM:
        return 'Medio';
      case Severity.LOW:
        return 'Bajo';
      default:
        return severity;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <p className="text-center mt-8">Cargando alertas de riesgo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Alertas de Riesgo de Caídas</h1>
          <Button onClick={() => navigate('/fall-prevention')}>
            Volver
          </Button>
        </div>

        {error && (
          <Alert type="error" message={error} className="mb-4" />
        )}

        {/* Puntuación de Riesgo */}
        {riskScore && (
          <Card className={`mb-6 ${getSeverityColor(riskScore.level)}`}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-2">Puntuación de Riesgo Total</h2>
                <p className="text-3xl font-bold">{riskScore.total.toFixed(1)}</p>
                <p className="text-sm mt-1">
                  Nivel de riesgo: <span className="font-semibold">{getSeverityLabel(riskScore.level)}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">Factores evaluados</p>
                <p className="text-2xl font-bold">{riskScore.factors.length}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Alertas Activas */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Alertas Activas</h2>
          
          {alerts.length === 0 ? (
            <Card>
              <p className="text-center text-slate-600 dark:text-slate-400">
                No hay alertas de riesgo activas
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`${getSeverityColor(alert.severity)} border-l-4`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">
                          {getRiskFactorLabel(alert.riskType)}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-white dark:bg-slate-800">
                          {getSeverityLabel(alert.severity)}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs mt-2 opacity-75">
                        Generada: {new Date(alert.createdAt).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Desglose de Factores de Riesgo */}
        {riskScore && riskScore.factors.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Desglose de Factores</h2>
            <Card>
              <div className="space-y-3">
                {riskScore.factors.map((factor, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0"
                  >
                    <span className="font-medium">
                      {getRiskFactorLabel(factor.type)}
                    </span>
                    <span className="text-lg font-bold">
                      {factor.score.toFixed(1)} pts
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Información sobre Requisitos */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                Requisitos SEGG
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1">
                <li>• Requisito 2.4: Alerta por sedantes prescritos</li>
                <li>• Requisito 2.5: Alerta por deterioro cognitivo</li>
                <li>• Requisito 2.6: Alerta por problemas de visión</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
