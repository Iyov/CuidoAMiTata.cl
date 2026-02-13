/**
 * User Preferences Screen
 * Pantalla de preferencias de usuario
 * Requisito: 11.4
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { useTheme } from '../contexts/ThemeContext';
import type { UserPreferences } from '../types/models';
import * as LocalStorageUtils from '../utils/localStorage';

const USER_PREFS_KEY = 'user-preferences';

export const UserPreferencesScreen: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    language: 'es',
    notificationSettings: {
      enableSound: true,
      enableVibration: true,
      enablePushNotifications: true,
      priorityFilter: 'ALL',
    },
    autoLogoutMinutes: 15,
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    try {
      const saved = LocalStorageUtils.getItem<UserPreferences>(USER_PREFS_KEY);
      if (saved) {
        setPreferences(saved);
      } else {
        // Usar tema actual si no hay preferencias guardadas
        setPreferences((prev) => ({ ...prev, theme }));
      }
    } catch (err) {
      console.error('Error al cargar preferencias:', err);
    }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    setPreferences((prev) => ({ ...prev, theme: newTheme }));
    setSuccess(false);
    setError(null);
  };

  const handleAutoLogoutChange = (minutes: number) => {
    if (minutes < 5) {
      setError('El tiempo mínimo de auto-logout es 5 minutos');
      return;
    }
    if (minutes > 120) {
      setError('El tiempo máximo de auto-logout es 120 minutos');
      return;
    }
    setPreferences((prev) => ({ ...prev, autoLogoutMinutes: minutes }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = () => {
    try {
      LocalStorageUtils.setItem(USER_PREFS_KEY, preferences);
      setSuccess(true);
      setError(null);

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar las preferencias');
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
        Preferencias de Usuario
      </h1>

      {success && (
        <Alert variant="success" className="mb-4">
          Preferencias guardadas exitosamente
        </Alert>
      )}

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        {/* Apariencia */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Apariencia
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-3">
                Tema de la aplicación
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    preferences.theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                      <span className="text-2xl">🌙</span>
                    </div>
                  </div>
                  <p className="font-medium text-slate-900 dark:text-white text-center">
                    Modo Oscuro
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    Predeterminado
                  </p>
                </button>

                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    preferences.theme === 'light'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <span className="text-2xl">☀️</span>
                    </div>
                  </div>
                  <p className="font-medium text-slate-900 dark:text-white text-center">
                    Modo Claro
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    Alternativo
                  </p>
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Idioma */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Idioma
          </h2>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Idioma de la aplicación
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Español (España)
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">
              Activo
            </span>
          </div>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 italic">
            Actualmente solo está disponible el idioma español
          </p>
        </Card>

        {/* Seguridad */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Seguridad
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-slate-900 dark:text-white mb-2">
                Tiempo de inactividad para cierre automático
              </label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                La sesión se cerrará automáticamente después de este tiempo sin actividad
              </p>
              
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={preferences.autoLogoutMinutes}
                  onChange={(e) => handleAutoLogoutChange(parseInt(e.target.value) || 15)}
                  className="w-24"
                />
                <span className="text-slate-700 dark:text-slate-300">minutos</span>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Recomendado:</strong> 15 minutos para equilibrar seguridad y comodidad
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="font-medium text-slate-900 dark:text-white mb-2">
                Características de seguridad activas
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500 mr-2">✓</span>
                  Cifrado AES-256 para datos sensibles
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500 mr-2">✓</span>
                  Autenticación JWT con tokens de refresco
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500 mr-2">✓</span>
                  Cierre de sesión automático por inactividad
                </li>
                <li className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-green-500 mr-2">✓</span>
                  Almacenamiento local cifrado
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Información de la aplicación */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Información de la Aplicación
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Versión</span>
              <span className="font-medium text-slate-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Última actualización</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {new Date().toLocaleDateString('es-ES')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Basado en directrices</span>
              <span className="font-medium text-slate-900 dark:text-white">SEGG</span>
            </div>
          </div>
        </Card>

        {/* Botón de guardar */}
        <div className="flex justify-end">
          <Button onClick={handleSave} variant="primary" size="lg">
            Guardar Preferencias
          </Button>
        </div>
      </div>
    </div>
  );
};
