import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { ThemeToggle } from './components/ThemeToggle';
import { PanicButton } from './components/PanicButton';
import { getIntegrationService } from './services';
import { getAuthService } from './services/AuthService';

// Import AuthScreen directly (not lazy loaded since it's needed immediately)
import { AuthScreen } from './screens/AuthScreen';

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
const BitacoraScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.BitacoraScreen }))
);
const FamilyScreen = lazy(() =>
  import('./screens').then((m) => ({ default: m.FamilyScreen }))
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
  const currentPatientId = localStorage.getItem('currentPatientId') || 'default-patient';
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Cuido a mi Tata</h1>
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
        <p className="text-lg mb-6">Cuidado de adultos mayores en Chile</p>
      
      <nav aria-label="Navegación principal">
        <ul className="space-y-4" role="list">
          <li>
            <Link
              to="/medications"
              className="block p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              aria-label="Ir a gestión de medicamentos"
            >
              <h2 className="text-xl font-semibold">Medicamentos</h2>
              <p className="text-sm opacity-90">Gestión de medicamentos y horarios de tu tata</p>
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
              aria-label="Ir a cuidado de la piel"
            >
              <h2 className="text-xl font-semibold">Cuidado de la Piel</h2>
              <p className="text-sm opacity-90">Cambios posturales y prevención de úlceras</p>
            </Link>
          </li>
          
          <li>
            <Link
              to="/polypharmacy"
              className="block p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              aria-label="Ir a gestión de polifarmacia"
            >
              <h2 className="text-xl font-semibold">Polifarmacia</h2>
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
          
          <li>
            <Link
              to="/bitacora"
              className="block p-4 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
              aria-label="Ir a bitácora diaria"
            >
              <h2 className="text-xl font-semibold">Bitácora Diaria</h2>
              <p className="text-sm opacity-90">Registro de comidas, ánimo y actividades</p>
            </Link>
          </li>
          
          <li>
            <Link
              to="/family"
              className="block p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
              aria-label="Ir a gestión familiar"
            >
              <h2 className="text-xl font-semibold">Gestión Familiar</h2>
              <p className="text-sm opacity-90">Administrar miembros y roles de la familia</p>
            </Link>
          </li>
        </ul>
      </nav>
      
      {/* Botón de pánico - siempre visible */}
      <div className="mt-8 flex justify-center">
        <PanicButton 
          patientId={currentPatientId}
          size="large"
          position="inline"
        />
      </div>
    </div>
  </div>
  );
};

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    console.log('🚀 App component mounted');
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication...');
        const authService = await getAuthService();
        const isValid = await authService.isAuthenticated();
        console.log('✅ Authentication check result:', isValid);
        setIsAuthenticated(isValid);
      } catch (error) {
        console.error('❌ Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        console.log('✅ Auth check complete, setting isCheckingAuth to false');
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Initialize integration service in background
    const initializeApp = async () => {
      try {
        console.log('🔧 Initializing integration service...');
        await getIntegrationService();
        console.log('✅ Integration service initialized successfully');
      } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
      }
    };

    initializeApp();
  }, []);

  const handleLoginSuccess = () => {
    console.log('🎉 Login success callback triggered');
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
  };

  const handleLogout = async () => {
    console.log('👋 Logout initiated');
    try {
      const authService = await getAuthService();
      await authService.logout();
      setIsAuthenticated(false);
      // Redirigir a la landing page
      window.location.href = '/index.html';
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Aún así redirigir a la landing page
      window.location.href = '/index.html';
    }
  };

  console.log('🎨 App rendering - isAuthenticated:', isAuthenticated, 'isCheckingAuth:', isCheckingAuth);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    console.log('⏳ Showing loading screen');
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
    console.log('🔐 Showing login screen');
    return (
      <ThemeProvider>
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  console.log('✅ Showing main app');
  // Basename para GitHub Pages: /app.html o /repo/app.html; en local / o /app.html
  const pathname = window.location.pathname;
  const appIdx = pathname.indexOf('app.html');
  const basename = appIdx >= 0 ? pathname.slice(0, appIdx) + 'app.html' : '/';

  return (
    <ThemeProvider>
      <FamilyProvider>
        <Router basename={basename}>
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
              <Route path="/bitacora" element={<BitacoraScreen />} />
              <Route path="/family" element={<FamilyScreen />} />
            </Routes>
          </Suspense>
        </Router>
      </FamilyProvider>
    </ThemeProvider>
  );
};
