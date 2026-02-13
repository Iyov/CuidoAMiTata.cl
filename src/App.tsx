import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthScreen } from './screens/AuthScreen';
import { getIntegrationService } from './services';
import { getAuthService } from './services/AuthService';

// Lazy loading de pantallas para optimizar carga inicial
const MedicationListScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.MedicationListScreen }))
);
const MedicationFormScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.MedicationFormScreen }))
);
const MedicationConfirmScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.MedicationConfirmScreen }))
);
const FallPreventionScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.FallPreventionScreen }))
);
const FallPreventionChecklistScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.FallPreventionChecklistScreen }))
);
const FallIncidentScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.FallIncidentScreen }))
);
const FallRiskAlertsScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.FallRiskAlertsScreen }))
);
const SkinIntegrityScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.SkinIntegrityScreen }))
);
const PosturalChangeScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.PosturalChangeScreen }))
);
const BedElevationScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.BedElevationScreen }))
);
const PressureUlcerScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.PressureUlcerScreen }))
);
const PolypharmacyScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.PolypharmacyScreen }))
);
const SIGREMapScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.SIGREMapScreen }))
);
const EthicalCareScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.EthicalCareScreen }))
);

// Componente de carga optimizado
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-lg">Cargando...</p>
    </div>
  </div>
);

const HomePage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const userName = localStorage.getItem('user_name') || 'Usuario';
  const userRole = localStorage.getItem('user_role') || 'cuidador';
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">CuidoAMiTata</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Bienvenido, {userName} ({userRole})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
        <p className="text-lg mb-6">Aplicación de gestión de cuidados geriátricos</p>
      
      <nav aria-label="Navegación principal">
        <ul className="space-y-4" role="list">
          <li>
            <Link
              to="/medications"
              className="block p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              aria-label="Ir a gestión de medicamentos"
            >
              <h2 className="text-xl font-semibold">Gestión de Medicamentos</h2>
              <p className="text-sm opacity-90">Administrar medicamentos y horarios</p>
            </Link>
          </li>
          
          <li>
            <Link
              to="/fall-prevention"
              className="block p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
              aria-label="Ir a prevención de caídas"
            >
              <h2 className="text-xl font-semibold">Prevención de Caídas</h2>
              <p className="text-sm opacity-90">Evaluación de riesgos y registro de incidentes</p>
            </Link>
          </li>
          
          <li>
            <Link
              to="/skin-integrity"
              className="block p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              aria-label="Ir a integridad de la piel"
            >
              <h2 className="text-xl font-semibold">Integridad de la Piel</h2>
              <p className="text-sm opacity-90">Cambios posturales y monitoreo de úlceras</p>
            </Link>
          </li>
          
          <li>
            <Link
              to="/polypharmacy"
              className="block p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              aria-label="Ir a gestión de polifarmacia"
            >
              <h2 className="text-xl font-semibold">Gestión de Polifarmacia</h2>
              <p className="text-sm opacity-90">Hoja de medicamentos, alertas y puntos SIGRE</p>
            </Link>
          </li>
          
          <li>
            <Link
              to="/ethical-care"
              className="block p-4 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
              aria-label="Ir a cuidado ético"
            >
              <h2 className="text-xl font-semibold">Cuidado Ético</h2>
              <p className="text-sm opacity-90">Evaluación de restricciones y alternativas</p>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  </div>
  );
};

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    console.log('App component mounted');
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const authService = await getAuthService();
        const isValid = await authService.isAuthenticated();
        setIsAuthenticated(isValid);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Initialize integration service in background
    const initializeApp = async () => {
      try {
        console.log('Initializing integration service...');
        await getIntegrationService();
        console.log('Integration service initialized successfully');
      } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
      }
    };

    initializeApp();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      const authService = await getAuthService();
      await authService.logout();
      setIsAuthenticated(false);
      // Redirigir a la landing page
      window.location.href = '/index.html';
    } catch (error) {
      console.error('Error during logout:', error);
      // Aún así redirigir a la landing page
      window.location.href = '/index.html';
    }
  };

  console.log('App rendering - isAuthenticated:', isAuthenticated, 'isCheckingAuth:', isCheckingAuth);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-lg">Cargando...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router basename={window.location.pathname.includes('app.html') ? '/app.html' : '/'}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage onLogout={handleLogout} />} />
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
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};
