import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Alert } from '../components';
import { getPolypharmacyManager } from '../services/PolypharmacyManager';
import type { Medication, StockAlert, ExpirationAlert } from '../types/models';
import * as IndexedDBUtils from '../utils/indexedDB';

export const PolypharmacyScreen: React.FC = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [expirationAlerts, setExpirationAlerts] = useState<ExpirationAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const manager = getPolypharmacyManager();

      // Cargar medicamentos
      const meds = await IndexedDBUtils.getAll<Medication>(
        IndexedDBUtils.STORES.MEDICATIONS
      );
      setMedications(meds.filter((m) => m.isActive));

      // Verificar alertas de stock
      const stockAlertsData = await manager.checkStockLevels();
      setStockAlerts(stockAlertsData);

      // Verificar alertas de caducidad
      const expirationAlertsData = await manager.checkExpirationDates();
      setExpirationAlerts(expirationAlertsData);
    } catch (err) {
      setError('Error al cargar datos de medicamentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      setError(null);

      const manager = getPolypharmacyManager();
      const result = await manager.exportToPDF('default-patient');

      if (result.ok) {
        // Crear URL del blob y descargar
        const url = URL.createObjectURL(result.value);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hoja-medicamentos-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error al exportar PDF');
      console.error(err);
    } finally {
      setExportingPDF(false);
    }
  };

  const handleShowSIGREMap = () => {
    navigate('/polypharmacy/sigre-map');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
        <p className="text-center mt-8">Cargando datos...</p>
      </div>
    );
  }

  const hasAlerts = stockAlerts.length > 0 || expirationAlerts.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Polifarmacia</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')}>Volver</Button>
          </div>
        </div>

        {error && <Alert type="error" message={error} className="mb-4" />}

        {/* Alertas de Stock y Caducidad */}
        {hasAlerts && (
          <div className="mb-6 space-y-3">
            {stockAlerts.map((alert) => (
              <Alert
                key={alert.medicationId}
                type="warning"
                message={alert.message}
              />
            ))}
            {expirationAlerts.map((alert) => (
              <Alert
                key={alert.medicationId}
                type={alert.daysUntilExpiration < 0 ? 'error' : 'warning'}
                message={alert.message}
              />
            ))}
          </div>
        )}

        {/* Hoja Dinámica de Medicamentos */}
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Hoja de Medicamentos</h2>
            <Button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              variant="primary"
            >
              {exportingPDF ? 'Exportando...' : '📄 Exportar PDF'}
            </Button>
          </div>

          {medications.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-4">
              No hay medicamentos registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-300 dark:border-slate-600">
                    <th className="text-left py-2 px-3">Nombre</th>
                    <th className="text-left py-2 px-3">Dosis</th>
                    <th className="text-left py-2 px-3">Propósito</th>
                    <th className="text-left py-2 px-3">Stock</th>
                    <th className="text-left py-2 px-3">Caducidad</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((med) => {
                    const hasStockAlert = stockAlerts.some(
                      (a) => a.medicationId === med.id
                    );
                    const hasExpirationAlert = expirationAlerts.some(
                      (a) => a.medicationId === med.id
                    );

                    return (
                      <tr
                        key={med.id}
                        className="border-b border-slate-200 dark:border-slate-700"
                      >
                        <td className="py-3 px-3">{med.name}</td>
                        <td className="py-3 px-3">{med.dosage}</td>
                        <td className="py-3 px-3">{med.purpose}</td>
                        <td
                          className={`py-3 px-3 ${
                            hasStockAlert
                              ? 'text-amber-600 dark:text-amber-400 font-semibold'
                              : ''
                          }`}
                        >
                          {med.stockLevel} días
                          {hasStockAlert && ' ⚠️'}
                        </td>
                        <td
                          className={`py-3 px-3 ${
                            hasExpirationAlert
                              ? 'text-amber-600 dark:text-amber-400 font-semibold'
                              : ''
                          }`}
                        >
                          {new Date(med.expirationDate).toLocaleDateString('es-ES')}
                          {hasExpirationAlert && ' ⚠️'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Botón de Puntos SIGRE */}
        <Card>
          <h2 className="text-xl font-semibold mb-3">Disposición Segura de Medicamentos</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Encuentre los puntos SIGRE más cercanos para desechar medicamentos caducados o no
            utilizados de forma segura.
          </p>
          <Button onClick={handleShowSIGREMap} variant="secondary">
            🗺️ Ver Mapa de Puntos SIGRE
          </Button>
        </Card>
      </div>
    </div>
  );
};
