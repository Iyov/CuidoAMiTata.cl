import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

// Placeholder para pantallas futuras
const HomePage: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-8">
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CuidoAMiTata</h1>
        <ThemeToggle />
      </div>
      <p className="text-lg">Aplicación de gestión de cuidados geriátricos</p>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};
