/**
 * Auth Screen
 * Pantalla de autenticación y seguridad
 * Requisito: 10.1, 10.2, 10.3
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { getAuthService } from '../services/AuthService';
import { getProfileService } from '../services/ProfileService';
import { getFamilyService } from '../services/FamilyService';
import { isSupabaseConfigured } from '../config/supabase';
import type { Credentials } from '../types/models';

interface AuthScreenProps {
  onLoginSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation');
  
  const [isLogin, setIsLogin] = useState(!invitationToken); // Si hay token, mostrar registro
  const [credentials, setCredentials] = useState<Credentials>({
    email: '',
    password: '',
  });
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationInfo, setInvitationInfo] = useState<{ email: string; familyName: string } | null>(null);

  // Cargar información de invitación si hay token
  useEffect(() => {
    const loadInvitation = async () => {
      if (!invitationToken) return;

      try {
        const familyService = getFamilyService();
        const result = await familyService.getInvitationByToken(invitationToken);
        
        if (result.ok) {
          const invitation = result.value;
          setInvitationInfo({
            email: invitation.email,
            familyName: 'la familia', // TODO: cargar nombre real de familia
          });
          setCredentials(prev => ({ ...prev, email: invitation.email }));
        } else {
          setError('Token de invitación inválido o expirado');
        }
      } catch (err) {
        console.error('Error al cargar invitación:', err);
        setError('Error al cargar invitación');
      }
    };

    loadInvitation();
  }, [invitationToken]);

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

    if (!isLogin && !name.trim()) {
      setError('Por favor, ingresa tu nombre');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Intentando autenticación con:', credentials.email);
      
      const authService = await getAuthService();
      console.log('✅ AuthService obtenido');
      
      if (isLogin) {
        console.log('📝 Llamando a login...');
        const result = await authService.login(credentials);
        console.log('📊 Resultado del login:', result);
        
        if (result.ok) {
          console.log('✅ Login exitoso!');
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            window.location.hash = '#/';
          }
        } else {
          console.error('❌ Error en login:', result.error);
          const msg = result.error.message;
          const isConfigError =
            msg.includes('Failed to fetch') ||
            msg.includes('ERR_NAME_NOT_RESOLVED') ||
            msg.includes('placeholder.supabase');
          setError(
            isConfigError
              ? 'Supabase no está configurado. Contacta al administrador.'
              : `Error al iniciar sesión: ${result.error.message}`
          );
        }
      } else {
        // Registro
        console.log('📝 Registrando nuevo usuario...');
        const registerResult = await authService.register(credentials);
        
        if (registerResult.ok) {
          console.log('✅ Registro exitoso, creando perfil...');
          const user = registerResult.value;
          
          // Verificar que tenemos el ID del usuario
          if (!user.id || !user.email) {
            setError('Error al obtener información del usuario. Intenta iniciar sesión.');
            return;
          }
          
          // Crear perfil automáticamente
          const profileService = getProfileService();
          const profileResult = await profileService.createProfile({
            id: user.id,
            email: user.email,
            name: name.trim(),
          });
          
          if (!profileResult.ok) {
            console.error('❌ Error al crear perfil:', profileResult.error);
            setError('Usuario creado pero error al crear perfil. Contacta al administrador.');
            return;
          }
          
          console.log('✅ Perfil creado');
          
          // Si hay token de invitación, aceptar la invitación
          if (invitationToken) {
            console.log('📧 Aceptando invitación...');
            const familyService = getFamilyService();
            const acceptResult = await familyService.acceptInvitation(invitationToken, user.id);
            
            if (!acceptResult.ok) {
              console.error('❌ Error al aceptar invitación:', acceptResult.error);
              setError('Usuario creado pero error al unirse a la familia. Contacta al administrador.');
              return;
            }
            
            console.log('✅ Invitación aceptada');
          }
          
          // Login automático después del registro
          const loginResult = await authService.login(credentials);
          if (loginResult.ok) {
            console.log('✅ Login automático exitoso');
            if (onLoginSuccess) {
              onLoginSuccess();
            } else {
              window.location.hash = '#/';
            }
          } else {
            setError('Cuenta creada exitosamente. Por favor, inicia sesión.');
            setIsLogin(true);
          }
        } else {
          console.error('❌ Error en registro:', registerResult.error);
          setError(`Error al crear cuenta: ${registerResult.error.message}`);
        }
      }
    } catch (err) {
      console.error('💥 Error crítico:', err);
      const msg = err instanceof Error ? err.message : String(err);
      const isConfigError =
        msg.includes('Failed to fetch') || msg.includes('ERR_NAME_NOT_RESOLVED') || msg.includes('placeholder');
      setError(
        isConfigError
          ? 'Supabase no está configurado. Contacta al administrador.'
          : `Error al procesar la solicitud: ${msg}`
      );
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
              src="img/CuidoAMiTata_Logo_500.png"
              alt="CuidoAMiTata"
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            CuidoAMiTata
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Cuidado de adultos mayores en Chile
          </p>
        </div>

        <Card>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            {isLogin ? 'Iniciar Sesión' : invitationToken ? 'Aceptar Invitación' : 'Crear Cuenta'}
          </h2>

          {invitationInfo && (
            <Alert variant="info" className="mb-4">
              Has sido invitado a unirte a {invitationInfo.familyName}. Crea tu cuenta para aceptar la invitación.
            </Alert>
          )}

          {!isSupabaseConfigured() && (
            <Alert variant="error" className="mb-4">
              <strong>Supabase no está configurado.</strong> Contacta al administrador del sistema.
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                label="Nombre completo"
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                fullWidth
                required
                autoComplete="name"
              />
            )}

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
              disabled={!!invitationToken} // Deshabilitar si viene de invitación
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
              disabled={loading || !isSupabaseConfigured()}
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
            {!invitationToken && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                {' '}
                <button
                  onClick={handleToggleMode}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
                </button>
              </p>
            )}
          </div>
        </Card>

        {/* Información de seguridad */}
        <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            🔒 Tu seguridad es nuestra prioridad
          </h3>
          <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>• Autenticación con Supabase</li>
            <li>• Cifrado AES-256 para datos sensibles</li>
            <li>• Tokens JWT seguros</li>
            <li>• Cierre automático por inactividad (15 min)</li>
          </ul>
        </div>

        {/* Información para nuevos usuarios */}
        {!invitationToken && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
              ¿Necesitas una cuenta? Solicita una invitación al administrador de tu familia
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
