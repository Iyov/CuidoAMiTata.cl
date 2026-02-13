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

  async logout(): Promise<Result<void>> {
    try {
      // Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error al cerrar sesión en Supabase:', error);
      }

      // Limpiar información local
      this.clearUserInfo();
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
    // Para Supabase, usamos el método asíncrono isAuthenticated
    // Este método es síncrono por compatibilidad, pero no es preciso
    const token = LocalStorageUtils.getItem<string>('user_id');
    return {
      isValid: !!token,
    };
  }

  private async saveUserInfo(userId: string, email: string): Promise<void> {
    try {
      // Obtener perfil del usuario desde la tabla profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', userId)
        .single();

      LocalStorageUtils.setItem('user_id', userId);
      LocalStorageUtils.setItem('user_email', email);
      
      if (profile) {
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
