/**
 * Notification Settings Screen
 * Pantalla de configuración de notificaciones
 * Requisito: 11.4
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import type { NotificationPreferences } from '../types/models';
import * as LocalStorageUtils from '../utils/localStorage';

const NOTIFICATION_PREFS_KEY = 'notification-preferences';

export const NotificationSettingsScreen: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableSound: true,
    enableVibration: true,
    enablePushNotifications: true,
    priorityFilter: 'ALL',
  });
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '22:00',
    end: '07:00',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    try {
      const saved = LocalStorageUtils.getItem<NotificationPreferences>(NOTIFICATION_PREFS_KEY);
      if (saved) {
        setPreferences(saved);
        
        // Cargar horario de silencio si existe
        if (saved.quietHoursStart && saved.quietHoursEnd) {
          setQuietHours({
            enabled: true,
            start: formatTimeForInput(saved.quietHoursStart),
            end: formatTimeForInput(saved.quietHoursEnd),
          });
        }
      }
    } catch (err) {
      console.error('Error al cargar preferencias:', err);
    }
  };

  const formatTimeForInput = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const parseTimeInput = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSuccess(false);
    setError(null);
  };

  const handlePriorityFilterChange = (filter: 'ALL' | 'HIGH_ONLY' | 'CRITICAL_ONLY') => {
    setPreferences((prev) => ({
      ...prev,
      priorityFilter: filter,
    }));
    setSuccess(false);
    setError(null);
  };

  const handleQuietHoursToggle = () => {
    setQuietHours((prev) => ({ ...prev, enabled: !prev.enabled }));
    setSuccess(false);
    setError(null);
  };

  const handleQuietHoursChange = (field: 'start' | 'end', value: string) => {
    setQuietHours((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = () => {
    try {
      const prefsToSave: NotificationPreferences = {
        ...preferences,
      };

      // Agregar horario de silencio si está habilitado
      if (quietHours.enabled) {
        prefsToSave.quietHoursStart = parseTimeInput(quietHours.start);
        prefsToSave.quietHoursEnd = parseTimeInput(quietHours.end);
      } else {
        prefsToSave.quietHoursStart = undefined;
        prefsToSave.quietHoursEnd = undefined;
      }

      LocalStorageUtils.setItem(NOTIFICATION_PREFS_KEY, prefsToSave);
      setSuccess(true);
      setError(null);

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar las preferencias');
      console.error(err);
    }
  };

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPreferences((prev) => ({ ...prev, enablePushNotifications: true }));
        setSuccess(true);
      } else {
        setError('Permiso de notificaciones denegado');
      }
    } else {
      setError('Las notificaciones no están soportadas en este navegador');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
        Configuración de Notificaciones
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
        {/* Notificaciones Push */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Notificaciones Push
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Habilitar notificaciones push
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Recibir notificaciones del sistema
                </p>
              </div>
              <button
                onClick={() => handleToggle('enablePushNotifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.enablePushNotifications
                    ? 'bg-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.enablePushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                  Se requiere permiso del navegador para mostrar notificaciones
                </p>
                <Button onClick={handleRequestPermission} variant="secondary" size="sm">
                  Solicitar Permiso
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Alertas de Audio y Vibración */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Alertas de Audio y Vibración
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Sonido de alerta
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Reproducir sonido para notificaciones críticas
                </p>
              </div>
              <button
                onClick={() => handleToggle('enableSound')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.enableSound
                    ? 'bg-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.enableSound ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Vibración
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Vibrar el dispositivo para alertas
                </p>
              </div>
              <button
                onClick={() => handleToggle('enableVibration')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.enableVibration
                    ? 'bg-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.enableVibration ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Filtro de Prioridad */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Filtro de Prioridad
          </h2>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Selecciona qué nivel de notificaciones deseas recibir
          </p>

          <div className="space-y-2">
            <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <input
                type="radio"
                name="priorityFilter"
                checked={preferences.priorityFilter === 'ALL'}
                onChange={() => handlePriorityFilterChange('ALL')}
                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="ml-3">
                <p className="font-medium text-slate-900 dark:text-white">Todas las notificaciones</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Recibir notificaciones de todos los niveles de prioridad
                </p>
              </div>
            </label>

            <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <input
                type="radio"
                name="priorityFilter"
                checked={preferences.priorityFilter === 'HIGH_ONLY'}
                onChange={() => handlePriorityFilterChange('HIGH_ONLY')}
                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="ml-3">
                <p className="font-medium text-slate-900 dark:text-white">Solo alta prioridad</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Recibir solo notificaciones de prioridad alta y crítica
                </p>
              </div>
            </label>

            <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <input
                type="radio"
                name="priorityFilter"
                checked={preferences.priorityFilter === 'CRITICAL_ONLY'}
                onChange={() => handlePriorityFilterChange('CRITICAL_ONLY')}
                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="ml-3">
                <p className="font-medium text-slate-900 dark:text-white">Solo críticas</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Recibir únicamente notificaciones críticas
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Horario de Silencio */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Horario de Silencio
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Habilitar horario de silencio
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Silenciar notificaciones no críticas durante ciertas horas
                </p>
              </div>
              <button
                onClick={handleQuietHoursToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  quietHours.enabled
                    ? 'bg-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    value={quietHours.start}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    value={quietHours.end}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
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
