/**
 * Auth Screen
 * Pantalla de autenticación y seguridad
 * Requisito: 12.1
 */

import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { getAuthService } from '../services/AuthService';
import type { Credentials } from '../types/models';

interface AuthScreenProps {
  onLoginSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [credentials, setCredentials] = useState<Credentials>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación
    if (!credentials.email || !credentials.password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (!credentials.email.includes('@')) {
      setError('Por favor, ingresa un email válido');
      return;
    }

    if (credentials.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const authService = await getAuthService();
      
      if (isLogin) {
        const result = await authService.login(credentials);
        
        if (result.ok) {
          // Login exitoso
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            window.location.hash = '#/';
          }
        } else {
          setError(result.error.message);
        }
      } else {
        // Registro (simulado por ahora)
        setError('El registro no está disponible en esta versión');
      }
    } catch (err) {
      setError('Error al procesar la solicitud');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/img/CuidoAMiTata_Logo_500.png"
              alt="CuidoAMiTata"
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            CuidoAMiTata
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gestión de cuidados geriátricos basada en evidencia
          </p>
        </div>

        <Card>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              placeholder="tu@email.com"
              fullWidth
              required
              autoComplete="email"
            />

            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              fullWidth
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              helperText={!isLogin ? 'Mínimo 6 caracteres' : undefined}
            />

            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  onClick={() => setError('La recuperación de contraseña no está disponible en esta versión')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
              size="lg"
            >
              {loading
                ? 'Procesando...'
                : isLogin
                ? 'Iniciar Sesión'
                : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
              {' '}
              <button
                onClick={handleToggleMode}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </p>
          </div>
        </Card>

        {/* Información de seguridad */}
        <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            🔒 Tu seguridad es nuestra prioridad
          </h3>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>• Cifrado AES-256 para datos sensibles</li>
            <li>• Autenticación JWT segura</li>
            <li>• Cierre automático por inactividad (15 min)</li>
            <li>• Cumplimiento con regulaciones de privacidad</li>
          </ul>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
            <strong>Demo:</strong> Usa cualquier email y contraseña de 6+ caracteres
          </p>
        </div>
      </div>
    </div>
  );
};
