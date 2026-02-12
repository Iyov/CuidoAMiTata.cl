import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import {
  MedicationListScreen,
  MedicationFormScreen,
  MedicationConfirmScreen,
  FallPreventionScreen,
  FallPreventionChecklistScreen,
  FallIncidentScreen,
  FallRiskAlertsScreen,
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
      </div>
    </div>
  </div>
);

export const App: React.FC = () => {
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
        </Routes>
      </Router>
    </ThemeProvider>
  );
};
