/**
 * Auth Service
 * Gestiona autenticación JWT y cierre de sesión automático
 */

import { Result, Ok, Err } from '../types/result';
import { ErrorCode } from '../types/enums';
import type { AuthToken, Credentials, SessionStatus } from '../types/models';
import * as LocalStorageUtils from '../utils/localStorage';

/**
 * Servicio de autenticación con JWT y auto-logout
 */
export class AuthService {
  private autoLogoutTimeout: ReturnType<typeof setTimeout> | null = null;
  private autoLogoutMinutes: number = 15; // Requisito 12.4: 15 minutos de inactividad
  private activityListeners: (() => void)[] = [];

  /**
   * Inicializa el servicio de autenticación
   */
  async initialize(): Promise<Result<void>> {
    try {
      // Configurar listeners de actividad del usuario
      this.setupActivityListeners();

      // Verificar si hay una sesión activa
      const session = this.checkSession();
      if (session.isValid) {
        // Reiniciar el temporizador de auto-logout
        this.resetAutoLogoutTimer();
      }

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Error al inicializar el servicio de autenticación',
        details: error,
      });
    }
  }

  /**
   * Inicia sesión con credenciales y devuelve JWT
   * 
   * @param credentials - Credenciales del usuario (email y password)
   * @returns Result con el token de autenticación
   */
  async login(credentials: Credentials): Promise<Result<AuthToken>> {
    try {
      // Validar credenciales
      if (!credentials.email || !credentials.password) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'El email y la contraseña son obligatorios',
        });
      }

      // En una implementación real, esto haría una llamada al backend
      // Por ahora, simulamos la autenticación
      const response = await this.authenticateWithBackend(credentials);

      if (!response.ok) {
        return response;
      }

      const authToken = response.value;

      // Guardar token en almacenamiento local
      LocalStorageUtils.setItem('auth_token', authToken.accessToken);
      LocalStorageUtils.setItem('refresh_token', authToken.refreshToken);
      LocalStorageUtils.setItem('token_expires_at', authToken.expiresAt.toISOString());

      // Iniciar temporizador de auto-logout
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

  /**
   * Cierra la sesión del usuario
   * 
   * @returns Result indicando éxito o error
   */
  async logout(): Promise<Result<void>> {
    try {
      // Limpiar tokens del almacenamiento
      LocalStorageUtils.removeItem('auth_token');
      LocalStorageUtils.removeItem('refresh_token');
      LocalStorageUtils.removeItem('token_expires_at');
      LocalStorageUtils.removeItem('user_id');

      // Cancelar temporizador de auto-logout
      this.clearAutoLogoutTimer();

      // En una implementación real, esto invalidaría el token en el backend
      await this.invalidateTokenOnBackend();

      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Error al cerrar sesión',
        details: error,
      });
    }
  }

  /**
   * Refresca el token de autenticación usando el refresh token
   * 
   * @param refreshToken - Token de refresco
   * @returns Result con el nuevo token de autenticación
   */
  async refreshToken(refreshToken: string): Promise<Result<AuthToken>> {
    try {
      // Validar refresh token
      if (!refreshToken) {
        return Err({
          code: ErrorCode.VALIDATION_REQUIRED_FIELD,
          message: 'El refresh token es obligatorio',
        });
      }

      // En una implementación real, esto haría una llamada al backend
      const response = await this.refreshTokenWithBackend(refreshToken);

      if (!response.ok) {
        return response;
      }

      const authToken = response.value;

      // Actualizar tokens en almacenamiento
      LocalStorageUtils.setItem('auth_token', authToken.accessToken);
      LocalStorageUtils.setItem('refresh_token', authToken.refreshToken);
      LocalStorageUtils.setItem('token_expires_at', authToken.expiresAt.toISOString());

      // Reiniciar temporizador de auto-logout
      this.resetAutoLogoutTimer();

      return Ok(authToken);
    } catch (error) {
      return Err({
        code: ErrorCode.AUTH_TOKEN_EXPIRED,
        message: 'Error al refrescar el token',
        details: error,
      });
    }
  }

  /**
   * Verifica el estado de la sesión actual
   * 
   * @returns Estado de la sesión
   */
  checkSession(): SessionStatus {
    try {
      const token = LocalStorageUtils.getItem<string>('auth_token');
      const expiresAtStr = LocalStorageUtils.getItem<string>('token_expires_at');
      const userId = LocalStorageUtils.getItem<string>('user_id');

      if (!token || !expiresAtStr) {
        return {
          isValid: false,
        };
      }

      const expiresAt = new Date(expiresAtStr);
      
      // Verificar si la fecha es válida
      if (isNaN(expiresAt.getTime())) {
        return {
          isValid: false,
        };
      }
      
      const now = new Date();

      // Verificar si el token ha expirado
      if (now >= expiresAt) {
        // Intentar refrescar el token automáticamente
        const refreshToken = LocalStorageUtils.getItem<string>('refresh_token');
        if (refreshToken) {
          // En una implementación real, esto refrescaría el token de forma asíncrona
          // Por ahora, marcamos la sesión como inválida
          return {
            isValid: false,
          };
        }

        return {
          isValid: false,
        };
      }

      return {
        isValid: true,
        expiresAt,
        userId: userId || undefined,
      };
    } catch (error) {
      return {
        isValid: false,
      };
    }
  }

  /**
   * Configura el cierre de sesión automático después de inactividad
   * Requisito 12.4: Cierre automático después de 15 minutos de inactividad
   * 
   * @param inactivityMinutes - Minutos de inactividad antes del cierre automático
   * @returns Result indicando éxito o error
   */
  enforceAutoLogout(inactivityMinutes: number): Result<void> {
    try {
      this.autoLogoutMinutes = inactivityMinutes;
      this.resetAutoLogoutTimer();
      return Ok(undefined);
    } catch (error) {
      return Err({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Error al configurar auto-logout',
        details: error,
      });
    }
  }

  /**
   * Reinicia el temporizador de auto-logout
   * Se llama cada vez que hay actividad del usuario
   */
  private resetAutoLogoutTimer(): void {
    // Limpiar temporizador existente
    this.clearAutoLogoutTimer();

    // Crear nuevo temporizador
    this.autoLogoutTimeout = setTimeout(() => {
      this.performAutoLogout();
    }, this.autoLogoutMinutes * 60 * 1000);
  }

  /**
   * Limpia el temporizador de auto-logout
   */
  private clearAutoLogoutTimer(): void {
    if (this.autoLogoutTimeout) {
      clearTimeout(this.autoLogoutTimeout);
      this.autoLogoutTimeout = null;
    }
  }

  /**
   * Ejecuta el cierre de sesión automático
   */
  private async performAutoLogout(): Promise<void> {
    console.log('Cerrando sesión automáticamente por inactividad');
    await this.logout();

    // Emitir evento personalizado para que la UI pueda reaccionar
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auto-logout', { detail: { reason: 'inactivity' } }));
    }
  }

  /**
   * Configura listeners para detectar actividad del usuario
   */
  private setupActivityListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Eventos que indican actividad del usuario
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Crear handler que reinicia el temporizador
    const activityHandler = () => {
      const session = this.checkSession();
      if (session.isValid) {
        this.resetAutoLogoutTimer();
      }
    };

    // Agregar listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, activityHandler, { passive: true });
      this.activityListeners.push(() => {
        window.removeEventListener(event, activityHandler);
      });
    });
  }

  /**
   * Limpia los listeners de actividad
   */
  private cleanupActivityListeners(): void {
    this.activityListeners.forEach((cleanup) => cleanup());
    this.activityListeners = [];
  }

  /**
   * Simula autenticación con el backend
   * En una implementación real, esto haría una llamada HTTP al servidor
   */
  private async authenticateWithBackend(credentials: Credentials): Promise<Result<AuthToken>> {
    // Simulación de llamada al backend
    return new Promise((resolve) => {
      setTimeout(() => {
        // Validación básica de credenciales (simulada)
        if (credentials.email && credentials.password.length >= 6) {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora

          const authToken: AuthToken = {
            accessToken: this.generateMockJWT(credentials.email),
            refreshToken: this.generateMockRefreshToken(),
            expiresAt,
          };

          // Guardar user ID simulado
          LocalStorageUtils.setItem('user_id', this.generateUserId(credentials.email));

          resolve(Ok(authToken));
        } else {
          resolve(
            Err({
              code: ErrorCode.AUTH_INVALID_CREDENTIALS,
              message: 'Credenciales inválidas',
            })
          );
        }
      }, 500); // Simular latencia de red
    });
  }

  /**
   * Simula refresco de token con el backend
   */
  private async refreshTokenWithBackend(refreshToken: string): Promise<Result<AuthToken>> {
    // Simulación de llamada al backend
    return new Promise((resolve) => {
      setTimeout(() => {
        if (refreshToken) {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora

          const authToken: AuthToken = {
            accessToken: this.generateMockJWT('refreshed@example.com'),
            refreshToken: this.generateMockRefreshToken(),
            expiresAt,
          };

          resolve(Ok(authToken));
        } else {
          resolve(
            Err({
              code: ErrorCode.AUTH_TOKEN_EXPIRED,
              message: 'Refresh token inválido',
            })
          );
        }
      }, 300);
    });
  }

  /**
   * Simula invalidación de token en el backend
   */
  private async invalidateTokenOnBackend(): Promise<void> {
    // En una implementación real, esto haría una llamada al backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 200);
    });
  }

  /**
   * Genera un JWT simulado
   */
  private generateMockJWT(email: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Genera un refresh token simulado
   */
  private generateMockRefreshToken(): string {
    return btoa(`refresh-${Date.now()}-${Math.random()}`);
  }

  /**
   * Genera un ID de usuario simulado
   */
  private generateUserId(email: string): string {
    return btoa(email).substring(0, 16);
  }

  /**
   * Limpia recursos del servicio
   */
  cleanup(): void {
    this.clearAutoLogoutTimer();
    this.cleanupActivityListeners();
  }
}

// Instancia singleton del servicio
let authServiceInstance: AuthService | null = null;

/**
 * Obtiene la instancia singleton del AuthService
 */
export async function getAuthService(): Promise<AuthService> {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
    const result = await authServiceInstance.initialize();
    if (!result.ok) {
      throw new Error('Failed to initialize AuthService');
    }
  }
  return authServiceInstance;
}

/**
 * Resetea la instancia del servicio (útil para pruebas)
 */
export function resetAuthService(): void {
  if (authServiceInstance) {
    authServiceInstance.cleanup();
  }
  authServiceInstance = null;
}
