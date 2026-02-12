import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert } from '../components';
import { getEthicalCareModule } from '../services/EthicalCareModule';
import type { Restraint, Strategy, CareContext } from '../types/models';
import { RestraintType, RestraintStatus, ErrorCode } from '../types/enums';
import * as IndexedDBUtils from '../utils/indexedDB';

export const EthicalCareScreen: React.FC = () => {
  const navigate = useNavigate();
  const [specificType, setSpecificType] = useState('');
  const [justification, setJustification] = useState('');
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [alternatives, setAlternatives] = useState<Strategy[]>([]);
  const [selectedAlternatives, setSelectedAlternatives] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckRestraint = () => {
    setError(null);
    setSuccess(null);

    if (!specificType.trim()) {
      setError('Debe especificar el tipo de restricción');
      return;
    }

    const ethicalCare = getEthicalCareModule();

    // Crear restricción temporal para validación
    const tempRestraint: Restraint = {
      id: `temp-${Date.now()}`,
      patientId: 'default-patient',
      type: RestraintType.MECHANICAL, // Se clasificará automáticamente
      specificType: specificType,
      justification: justification,
      alternatives: [],
      authorizedBy: '',
      startTime: new Date(),
      status: RestraintStatus.ACTIVE,
      reviewSchedule: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Clasificar el tipo de restricción
    const classifiedType = ethicalCare.classifyRestraint(tempRestraint);
    tempRestraint.type = classifiedType;

    // Validar la restricción
    const validation = ethicalCare.validateRestraint(tempRestraint);

    if (!validation.isValid) {
      // Si es restricción química bloqueada, mostrar modal de bloqueo
      if (validation.errorCode === ErrorCode.BUSINESS_CHEMICAL_RESTRAINT_BLOCKED) {
        setBlockMessage(validation.message!);
        setShowBlockModal(true);

        // Obtener estrategias alternativas
        const context: CareContext = {
          patientId: 'default-patient',
          situation: specificType,
        };
        const strategies = ethicalCare.getAlternativeStrategies(context);
        setAlternatives(strategies);
        setShowAlternatives(true);
      } else {
        setError(validation.message!);
      }
    } else {
      // Restricción válida, mostrar alternativas antes de permitir registro
      const context: CareContext = {
        patientId: 'default-patient',
        situation: specificType,
      };
      const strategies = ethicalCare.getAlternativeStrategies(context);
      setAlternatives(strategies);
      setShowAlternatives(true);
    }
  };

  const handleRegisterRestraint = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!justification.trim()) {
        setError('Debe proporcionar una justificación documentada');
        setLoading(false);
        return;
      }

      if (selectedAlternatives.length === 0) {
        setError('Debe documentar las estrategias alternativas consideradas');
        setLoading(false);
        return;
      }

      const ethicalCare = getEthicalCareModule();

      const restraint: Restraint = {
        id: `restraint-${Date.now()}`,
        patientId: 'default-patient',
        type: RestraintType.MECHANICAL,
        specificType: specificType,
        justification: justification,
        alternatives: selectedAlternatives,
        authorizedBy: 'current-user', // TODO: usar usuario actual
        startTime: new Date(),
        status: RestraintStatus.ACTIVE,
        reviewSchedule: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Clasificar y validar
      restraint.type = ethicalCare.classifyRestraint(restraint);
      const validation = ethicalCare.validateRestraint(restraint);

      if (!validation.isValid) {
        setError(validation.message!);
        setLoading(false);
        return;
      }

      // Guardar en IndexedDB
      await IndexedDBUtils.put(IndexedDBUtils.STORES.CARE_EVENTS, {
        id: restraint.id,
        patientId: restraint.patientId,
        eventType: 'RESTRAINT',
        timestamp: restraint.startTime,
        performedBy: restraint.authorizedBy,
        syncStatus: 'PENDING',
        metadata: restraint,
        createdAt: new Date(),
      });

      setSuccess('Restricción registrada correctamente');
      
      // Limpiar formulario
      setTimeout(() => {
        setSpecificType('');
        setJustification('');
        setSelectedAlternatives([]);
        setShowAlternatives(false);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError('Error al registrar restricción');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlternative = (strategyId: string) => {
    if (selectedAlternatives.includes(strategyId)) {
      setSelectedAlternatives(selectedAlternatives.filter((id) => id !== strategyId));
    } else {
      setSelectedAlternatives([...selectedAlternatives, strategyId]);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Módulo de Cuidado Ético</h1>
          <Button onClick={() => navigate('/')}>Volver</Button>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}
        {success && <Alert type="success" message={success} className="mb-4" />}

        {/* Modal de Bloqueo para Restricciones Químicas */}
        {showBlockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">🚫</span>
                  <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                    Restricción Bloqueada
                  </h2>
                </div>
                <Alert type="error" message={blockMessage} />
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Estrategias Alternativas Recomendadas:</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Considere las siguientes alternativas éticas antes de usar restricciones:
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {alternatives.map((strategy) => (
                  <Card key={strategy.id} className="bg-slate-50 dark:bg-slate-800">
                    <h4 className="font-semibold mb-2">{strategy.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {strategy.description}
                    </p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                      {strategy.examples.map((example, idx) => (
                        <li key={idx}>{example}</li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>

              <Button onClick={() => setShowBlockModal(false)} className="w-full">
                Entendido
              </Button>
            </Card>
          </div>
        )}

        {/* Formulario de Evaluación de Restricción */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Evaluación de Restricción</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de restricción a evaluar
              </label>
              <input
                type="text"
                value={specificType}
                onChange={(e) => setSpecificType(e.target.value)}
                placeholder="Ej: Barandillas laterales, Sedante para agitación, etc."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Justificación (opcional en esta etapa)
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Describa la situación y por qué considera necesaria esta medida..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
              />
            </div>

            <Button onClick={handleCheckRestraint} variant="primary">
              Evaluar Restricción
            </Button>
          </div>
        </Card>

        {/* Panel de Estrategias Alternativas */}
        {showAlternatives && !showBlockModal && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Estrategias Alternativas</h2>
            <Alert
              type="info"
              message="Antes de registrar cualquier restricción, debe considerar y documentar las estrategias alternativas evaluadas."
              className="mb-4"
            />

            <div className="space-y-3 mb-6">
              {alternatives.map((strategy) => (
                <Card
                  key={strategy.id}
                  className={`cursor-pointer transition-all ${
                    selectedAlternatives.includes(strategy.id)
                      ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500'
                      : 'bg-slate-50 dark:bg-slate-800'
                  }`}
                  onClick={() => toggleAlternative(strategy.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAlternatives.includes(strategy.id)}
                      onChange={() => toggleAlternative(strategy.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{strategy.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {strategy.description}
                      </p>
                      <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                        {strategy.examples.map((example, idx) => (
                          <li key={idx}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Formulario de Justificación Obligatoria */}
            <Card className="bg-amber-50 dark:bg-amber-900">
              <h3 className="font-semibold mb-3">Justificación Obligatoria</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Debe proporcionar una justificación documentada explicando por qué las
                estrategias alternativas no son suficientes en este caso.
              </p>

              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Justificación detallada obligatoria..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 mb-3"
                required
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleRegisterRestraint}
                  disabled={loading || !justification.trim() || selectedAlternatives.length === 0}
                  variant="primary"
                >
                  {loading ? 'Registrando...' : 'Registrar Restricción'}
                </Button>
                <Button
                  onClick={() => {
                    setShowAlternatives(false);
                    setSelectedAlternatives([]);
                  }}
                  variant="secondary"
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </Card>
        )}

        {/* Información sobre Cuidado Ético */}
        <Card>
          <h3 className="font-semibold mb-3">Principios de Cuidado Ético</h3>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
            <li>
              <strong>Restricciones químicas bloqueadas:</strong> No se permite el uso de
              sedantes para manejo conductual
            </li>
            <li>
              <strong>Restricciones mecánicas:</strong> Barandillas, cinturones y sujeciones
              requieren justificación documentada
            </li>
            <li>
              <strong>Estrategias alternativas primero:</strong> Siempre considere alternativas
              no restrictivas antes de cualquier restricción
            </li>
            <li>
              <strong>Justificación obligatoria:</strong> Toda restricción debe estar
              documentada con justificación clara
            </li>
            <li>
              <strong>Revisión periódica:</strong> Las restricciones deben revisarse
              regularmente para determinar si siguen siendo necesarias
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
