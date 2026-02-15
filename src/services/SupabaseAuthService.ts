/**
 * Supabase Auth Service
 * Servicio de autenticación real usando Supabase
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type { AuthToken, Credentials, SessionStatus } from '../types/models';
import { supabase } from '../config/supabase';
import * as LocalStorageUtils from '../utils/localStorage';

export class SupabaseAuthService {
  private autoLogoutTimeout: ReturnType<typeof setTimeout> | null = null;
  private autoLogoutMinutes: number = 15;
  private activityListeners: (() => void)[] = [];

  async initialize(): Promise<Result<void>> {
    try {
      this.setupActivityListeners();
      
      // Verificar sesión existente en Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Guardar información del usuario
        await this.saveUserInfo(session.user.id, session.user.email || '');
        this.resetAutoLogoutTimer();
      }

      // Escuchar cambios de autenticación
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          this.clearUserInfo();
        } else if (event === 'SIGNED_IN' && session) {
          this.saveUserInfo(session.user.id, session.user.email || '');
          this.resetAutoLogoutTimer();
        }
      });

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Error al inicializar el servicio de autenticación',
        details: error,
      });
    }
  }

  async login(credentials: Credentials): Promise<Result<AuthToken>> {
    try {
      if (!credentials.email || !credentials.password) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'El email y la contraseña son obligatorios',
        });
      }

      // Autenticar con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return Err({
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: error.message === 'Invalid login credentials' 
            ? 'Email o contraseña incorrectos'
            : error.message,
        });
      }

      if (!data.session) {
        return Err({
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: 'No se pudo crear la sesión',
        });
      }

      // Guardar información del usuario
      await this.saveUserInfo(data.user.id, data.user.email || '');

      const authToken: AuthToken = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: new Date(data.session.expires_at! * 1000),
      };

      // Guardar tokens en localStorage para checkSession y reuso
      LocalStorageUtils.setItem('auth_token', authToken.accessToken);
      LocalStorageUtils.setItem('refresh_token', authToken.refreshToken);
      LocalStorageUtils.setItem('token_expires_at', authToken.expiresAt.toISOString());

      this.resetAutoLogoutTimer();

      return Ok(authToken);
    } catch (error) {
      return Err({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Error al iniciar sesión',
        details: error,
      });
    }
  }

  async register(credentials: Credentials): Promise<Result<AuthToken>> {
    try {
      if (!credentials.email || !credentials.password) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'El email y la contraseña son obligatorios',
        });
      }

      if (credentials.password.length < 6) {
        return Err({
          code: ErrorCode.VALIDATION_INVALID_FORMAT,
          message: 'La contraseña debe tener al menos 6 caracteres',
        });
      }

      // Registrar con Supabase
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return Err({
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: error.message === 'User already registered' 
            ? 'Este email ya está registrado'
            : error.message,
        });
      }

      if (!data.user) {
        return Err({
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: 'No se pudo crear el usuario',
        });
      }

      // Retornar información del usuario creado
      const authToken: AuthToken = {
        accessToken: data.session?.access_token || '',
        refreshToken: data.session?.refresh_token || '',
        expiresAt: data.session?.expires_at 
          ? new Date(data.session.expires_at * 1000)
          : new Date(Date.now() + 3600000),
        id: data.user.id,
        email: data.user.email || credentials.email,
      };

      return Ok(authToken);
    } catch (error) {
      return Err({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Error al crear la cuenta',
        details: error,
      });
    }
  }

  async logout(): Promise<Result<void>> {
    try {
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error al cerrar sesión en Supabase:', error);
      }

      // Limpiar información local y tokens
      this.clearUserInfo();
      LocalStorageUtils.removeItem('auth_token');
      LocalStorageUtils.removeItem('refresh_token');
      LocalStorageUtils.removeItem('token_expires_at');
      this.clearAutoLogoutTimer();

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Error al cerrar sesión',
        details: error,
      });
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
  }

  checkSession(): SessionStatus {
    // Revisar tokens almacenados en localStorage para determinar validez
    const token = LocalStorageUtils.getItem<string>('auth_token');
    const expiresAtStr = LocalStorageUtils.getItem<string>('token_expires_at');

    if (!token || !expiresAtStr) {
      return { isValid: false };
    }

    const expiresAt = new Date(expiresAtStr);
    if (Number.isNaN(expiresAt.getTime())) {
      return { isValid: false };
    }

    return {
      isValid: expiresAt.getTime() > Date.now(),
      expiresAt,
      userId: LocalStorageUtils.getItem<string>('user_id') || undefined,
    };
  }

  private async saveUserInfo(userId: string, email: string): Promise<void> {
    try {
      // Guardar información básica primero
      LocalStorageUtils.setItem('user_id', userId);
      LocalStorageUtils.setItem('user_email', email);
      
      // Intentar obtener perfil del usuario desde la tabla profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('No se encontró perfil para el usuario, usando valores por defecto:', error);
        // Intentar crear el perfil automáticamente
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            name: email.split('@')[0],
            role: 'cuidador'
          });
        
        if (insertError) {
          console.error('Error al crear perfil automáticamente:', insertError);
        }
        
        // Usar valores por defecto
        LocalStorageUtils.setItem('user_name', email.split('@')[0]);
        LocalStorageUtils.setItem('user_role', 'cuidador');
      } else if (profile) {
        LocalStorageUtils.setItem('user_name', profile.name);
        LocalStorageUtils.setItem('user_role', profile.role);
      } else {
        // Si no hay perfil, usar valores por defecto
        LocalStorageUtils.setItem('user_name', email.split('@')[0]);
        LocalStorageUtils.setItem('user_role', 'cuidador');
      }
    } catch (error) {
      console.error('Error al guardar información del usuario:', error);
      // Continuar con valores por defecto
      LocalStorageUtils.setItem('user_id', userId);
      LocalStorageUtils.setItem('user_email', email);
      LocalStorageUtils.setItem('user_name', email.split('@')[0]);
      LocalStorageUtils.setItem('user_role', 'cuidador');
    }
  }

  private clearUserInfo(): void {
    LocalStorageUtils.removeItem('user_id');
    LocalStorageUtils.removeItem('user_name');
    LocalStorageUtils.removeItem('user_role');
    LocalStorageUtils.removeItem('user_email');
  }

  private resetAutoLogoutTimer(): void {
    this.clearAutoLogoutTimer();
    this.autoLogoutTimeout = setTimeout(() => {
      this.performAutoLogout();
    }, this.autoLogoutMinutes * 60 * 1000);
  }

  /**
   * Permite forzar el tiempo de auto-logout en minutos (expuesto para tests y configuración)
   */
  enforceAutoLogout(minutes: number) {
    if (!Number.isInteger(minutes) || minutes <= 0) {
      return Err({ code: ErrorCode.VALIDATION_REQUIRED_FIELD, message: 'Valor de minutos inválido' });
    }

    this.autoLogoutMinutes = minutes;
    this.resetAutoLogoutTimer();
    return Ok(undefined);
  }

  private clearAutoLogoutTimer(): void {
    if (this.autoLogoutTimeout) {
      clearTimeout(this.autoLogoutTimeout);
      this.autoLogoutTimeout = null;
    }
  }

  private async performAutoLogout(): Promise<void> {
    console.log('Cerrando sesión automáticamente por inactividad');
    await this.logout();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auto-logout', { detail: { reason: 'inactivity' } }));
    }
  }

  private setupActivityListeners(): void {
    if (typeof window === 'undefined') return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const activityHandler = async () => {
      const isAuth = await this.isAuthenticated();
      if (isAuth) {
        this.resetAutoLogoutTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, activityHandler, { passive: true });
      this.activityListeners.push(() => {
        window.removeEventListener(event, activityHandler);
      });
    });
  }

  private cleanupActivityListeners(): void {
    this.activityListeners.forEach((cleanup) => cleanup());
    this.activityListeners = [];
  }

  cleanup(): void {
    this.clearAutoLogoutTimer();
    this.cleanupActivityListeners();
  }

  /**
   * Refrescar tokens usando refresh token (expone funcionalidad usada por tests)
   */
  async refreshToken(refreshToken: string): Promise<Result<AuthToken>> {
    try {
      if (!refreshToken) {
        return Err({ code: ErrorCode.VALIDATION_REQUIRED_FIELD, message: 'Refresh token es requerido' });
      }

      // Usar setSession para intercambiar refresh token por nueva sesión
      // Nota: supabase.auth.setSession acepta { refresh_token }
      // (si la API cambia, el test deberá adaptarse)
      const { data, error } = await supabase.auth.setSession({ refresh_token: refreshToken });

      if (error || !data || !data.session) {
        return Err({ code: ErrorCode.AUTH_INVALID_CREDENTIALS, message: 'No se pudo refrescar el token', details: error });
      }

      const authToken: AuthToken = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: new Date(data.session.expires_at! * 1000),
      };

      // Actualizar almacenamiento local
      LocalStorageUtils.setItem('auth_token', authToken.accessToken);
      LocalStorageUtils.setItem('refresh_token', authToken.refreshToken);
      LocalStorageUtils.setItem('token_expires_at', authToken.expiresAt.toISOString());

      // Si hay usuario en sesión, guardar info básica
      if (data.session.user) {
        await this.saveUserInfo(data.session.user.id, data.session.user.email || '');
      }

      this.resetAutoLogoutTimer();

      return Ok(authToken);
    } catch (err) {
      return Err({ code: ErrorCode.AUTH_INVALID_CREDENTIALS, message: 'Error al refrescar token', details: err });
    }
  }
}


let supabaseAuthServiceInstance: SupabaseAuthService | null = null;

export async function getSupabaseAuthService(): Promise<SupabaseAuthService> {
  if (!supabaseAuthServiceInstance) {
    supabaseAuthServiceInstance = new SupabaseAuthService();
    const result = await supabaseAuthServiceInstance.initialize();
    if (!result.ok) {
      throw new Error('Failed to initialize SupabaseAuthService');
    }
  }
  return supabaseAuthServiceInstance;
}

export function resetSupabaseAuthService(): void {
  if (supabaseAuthServiceInstance) {
    supabaseAuthServiceInstance.cleanup();
  }
  supabaseAuthServiceInstance = null;
}
