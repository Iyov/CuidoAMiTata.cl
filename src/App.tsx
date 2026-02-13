import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { getIntegrationService } from './services';
import {
  MedicationListScreen,
  MedicationFormScreen,
  MedicationConfirmScreen,
  FallPreventionScreen,
  FallPreventionChecklistScreen,
  FallIncidentScreen,
  FallRiskAlertsScreen,
  SkinIntegrityScreen,
  PosturalChangeScreen,
  BedElevationScreen,
  PressureUlcerScreen,
  PolypharmacyScreen,
  SIGREMapScreen,
  EthicalCareScreen,
} from './screens';

const HomePage: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8">
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CuidoAMiTata</h1>
        <ThemeToggle />
      </div>
      <p className="text-lg mb-6">Aplicación de gestión de cuidados geriátricos</p>
      
      <div className="space-y-4">
        <Link
          to="/medications"
          className="block p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <h2 className="text-xl font-semibold">Gestión de Medicamentos</h2>
          <p className="text-sm opacity-90">Administrar medicamentos y horarios</p>
        </Link>
        
        <Link
          to="/fall-prevention"
          className="block p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
        >
          <h2 className="text-xl font-semibold">Prevención de Caídas</h2>
          <p className="text-sm opacity-90">Evaluación de riesgos y registro de incidentes</p>
        </Link>
        
        <Link
          to="/skin-integrity"
          className="block p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <h2 className="text-xl font-semibold">Integridad de la Piel</h2>
          <p className="text-sm opacity-90">Cambios posturales y monitoreo de úlceras</p>
        </Link>
        
        <Link
          to="/polypharmacy"
          className="block p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
          <h2 className="text-xl font-semibold">Gestión de Polifarmacia</h2>
          <p className="text-sm opacity-90">Hoja de medicamentos, alertas y puntos SIGRE</p>
        </Link>
        
        <Link
          to="/ethical-care"
          className="block p-4 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
        >
          <h2 className="text-xl font-semibold">Cuidado Ético</h2>
          <p className="text-sm opacity-90">Evaluación de restricciones y alternativas</p>
        </Link>
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
  const [integrationReady, setIntegrationReady] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize integration service on app startup
    const initializeIntegration = async () => {
      try {
        const integrationService = await getIntegrationService();
        const verificationResult = await integrationService.verifyIntegration();
        
        if (verificationResult.isError()) {
          setIntegrationError(verificationResult.error.message);
        } else {
          setIntegrationReady(true);
        }
      } catch (error) {
        setIntegrationError(
          error instanceof Error ? error.message : 'Error al inicializar la aplicación'
        );
      }
    };

    initializeIntegration();
  }, []);

  if (integrationError) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Error de Inicialización</h1>
            <p className="text-lg">{integrationError}</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!integrationReady) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Cargando...</h1>
            <p className="text-lg">Inicializando servicios...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/medications" element={<MedicationListScreen />} />
          <Route path="/medications/add" element={<MedicationFormScreen />} />
          <Route path="/medications/:id/edit" element={<MedicationFormScreen />} />
          <Route path="/medications/:id/confirm" element={<MedicationConfirmScreen />} />
          <Route path="/fall-prevention" element={<FallPreventionScreen />} />
          <Route path="/fall-prevention/checklist" element={<FallPreventionChecklistScreen />} />
          <Route path="/fall-prevention/incident" element={<FallIncidentScreen />} />
          <Route path="/fall-prevention/alerts" element={<FallRiskAlertsScreen />} />
          <Route path="/skin-integrity" element={<SkinIntegrityScreen />} />
          <Route path="/skin-integrity/postural-change" element={<PosturalChangeScreen />} />
          <Route path="/skin-integrity/bed-elevation" element={<BedElevationScreen />} />
          <Route path="/skin-integrity/pressure-ulcer" element={<PressureUlcerScreen />} />
          <Route path="/polypharmacy" element={<PolypharmacyScreen />} />
          <Route path="/polypharmacy/sigre-map" element={<SIGREMapScreen />} />
          <Route path="/ethical-care" element={<EthicalCareScreen />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};
