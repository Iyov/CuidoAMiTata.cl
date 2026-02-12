/**
 * Unit tests for AuthService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService, getAuthService, resetAuthService } from './AuthService';
import { ErrorCode } from '../types/enums';
import { isOk, isErr } from '../types/result';
import * as LocalStorageUtils from '../utils/localStorage';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Limpiar estado antes de cada prueba
    resetAuthService();
    LocalStorageUtils.clear();
    
    // Limpiar timers
    vi.clearAllTimers();
    
    service = await getAuthService();
  });

  afterEach(() => {
    resetAuthService();
    vi.restoreAllMocks();
  });

  describe('initialize', () => {
    it('debe inicializar correctamente el servicio', async () => {
      const newService = new AuthService();
      const result = await newService.initialize();
      
      expect(isOk(result)).toBe(true);
    });

    it('debe configurar listeners de actividad', async () => {
      const newService = new AuthService();
      await newService.initialize();
      
      // El servicio debe estar inicializado sin errores
      expect(newService).toBeDefined();
    });
  });

  describe('login', () => {
    it('debe iniciar sesión con credenciales válidas', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await service.login(credentials);
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.accessToken).toBeDefined();
        expect(result.value.refreshToken).toBeDefined();
        expect(result.value.expiresAt).toBeInstanceOf(Date);
      }
    });

    it('debe guardar tokens en almacenamiento local', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'securepass',
      };

      await service.login(credentials);
      
      const token = LocalStorageUtils.getItem<string>('auth_token');
      const refreshToken = LocalStorageUtils.getItem<string>('refresh_token');
      const expiresAt = LocalStorageUtils.getItem<string>('token_expires_at');
      
      expect(token).not.toBeNull();
      expect(refreshToken).not.toBeNull();
      expect(expiresAt).not.toBeNull();
    });

    it('debe rechazar credenciales sin email', async () => {
      const credentials = {
        email: '',
        password: 'password123',
      };

      const result = await service.login(credentials);
      
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });

    it('debe rechazar credenciales sin password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: '',
      };

      const result = await service.login(credentials);
      
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });

    it('debe rechazar contraseñas cortas', async () => {
      const credentials = {
        email: 'test@example.com',
        password: '12345', // Menos de 6 caracteres
      };

      const result = await service.login(credentials);
      
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ErrorCode.AUTH_INVALID_CREDENTIALS);
      }
    });

    it('debe generar JWT con formato correcto', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await service.login(credentials);
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        const token = result.value.accessToken;
        const parts = token.split('.');
        
        // JWT debe tener 3 partes: header.payload.signature
        expect(parts).toHaveLength(3);
      }
    });
  });

  describe('logout', () => {
    it('debe cerrar sesión correctamente', async () => {
      // Primero iniciar sesión
      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Luego cerrar sesión
      const result = await service.logout();
      
      expect(isOk(result)).toBe(true);
    });

    it('debe eliminar tokens del almacenamiento', async () => {
      // Iniciar sesión
      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Cerrar sesión
      await service.logout();
      
      const token = LocalStorageUtils.getItem<string>('auth_token');
      const refreshToken = LocalStorageUtils.getItem<string>('refresh_token');
      const expiresAt = LocalStorageUtils.getItem<string>('token_expires_at');
      const userId = LocalStorageUtils.getItem<string>('user_id');
      
      expect(token).toBeNull();
      expect(refreshToken).toBeNull();
      expect(expiresAt).toBeNull();
      expect(userId).toBeNull();
    });

    it('debe funcionar incluso sin sesión activa', async () => {
      const result = await service.logout();
      
      expect(isOk(result)).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('debe refrescar token con refresh token válido', async () => {
      const refreshToken = 'valid_refresh_token';
      
      const result = await service.refreshToken(refreshToken);
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.accessToken).toBeDefined();
        expect(result.value.refreshToken).toBeDefined();
        expect(result.value.expiresAt).toBeInstanceOf(Date);
      }
    });

    it('debe actualizar tokens en almacenamiento', async () => {
      const refreshToken = 'valid_refresh_token';
      
      await service.refreshToken(refreshToken);
      
      const newToken = LocalStorageUtils.getItem<string>('auth_token');
      const newRefreshToken = LocalStorageUtils.getItem<string>('refresh_token');
      
      expect(newToken).not.toBeNull();
      expect(newRefreshToken).not.toBeNull();
    });

    it('debe rechazar refresh token vacío', async () => {
      const result = await service.refreshToken('');
      
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
      }
    });
  });

  describe('checkSession', () => {
    it('debe retornar sesión inválida sin tokens', () => {
      const session = service.checkSession();
      
      expect(session.isValid).toBe(false);
      expect(session.expiresAt).toBeUndefined();
      expect(session.userId).toBeUndefined();
    });

    it('debe retornar sesión válida con tokens activos', async () => {
      // Iniciar sesión
      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      const session = service.checkSession();
      
      expect(session.isValid).toBe(true);
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.userId).toBeDefined();
    });

    it('debe retornar sesión inválida con token expirado', async () => {
      // Simular token expirado
      LocalStorageUtils.setItem('auth_token', 'expired_token');
      LocalStorageUtils.setItem('refresh_token', 'refresh_token');
      
      // Establecer fecha de expiración en el pasado
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hora atrás
      LocalStorageUtils.setItem('token_expires_at', pastDate.toISOString());

      const session = service.checkSession();
      
      expect(session.isValid).toBe(false);
    });

    it('debe manejar tokens con formato inválido', () => {
      LocalStorageUtils.setItem('auth_token', 'invalid_token');
      LocalStorageUtils.setItem('token_expires_at', 'invalid_date');
      LocalStorageUtils.setItem('refresh_token', 'refresh_token');

      const session = service.checkSession();
      
      // Debe manejar el error gracefully
      // Con fecha inválida, new Date('invalid_date') crea una fecha inválida
      // que falla la comparación, resultando en sesión inválida
      expect(session.isValid).toBe(false);
    });
  });

  describe('enforceAutoLogout', () => {
    it('debe configurar tiempo de auto-logout', () => {
      const result = service.enforceAutoLogout(20);
      
      expect(isOk(result)).toBe(true);
    });

    it('debe aceptar diferentes valores de minutos', () => {
      const result1 = service.enforceAutoLogout(5);
      const result2 = service.enforceAutoLogout(15);
      const result3 = service.enforceAutoLogout(30);
      
      expect(isOk(result1)).toBe(true);
      expect(isOk(result2)).toBe(true);
      expect(isOk(result3)).toBe(true);
    });
  });

  describe('Auto-logout functionality', () => {
    it('debe configurar temporizador de auto-logout al iniciar sesión', async () => {
      // Requisito 12.4: Cierre automático después de 15 minutos de inactividad
      
      // Iniciar sesión
      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(isOk(result)).toBe(true);
      
      // Verificar que la sesión está activa
      const session = service.checkSession();
      expect(session.isValid).toBe(true);
      
      // El temporizador debe estar configurado internamente
      // (no podemos verificarlo directamente sin exponer internals)
    });

    it('debe permitir configurar tiempo de auto-logout personalizado', () => {
      const result = service.enforceAutoLogout(20);
      expect(isOk(result)).toBe(true);
    });

    it('debe limpiar temporizador al cerrar sesión manualmente', async () => {
      // Iniciar sesión
      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Cerrar sesión manualmente
      const result = await service.logout();
      expect(isOk(result)).toBe(true);

      // La sesión debe estar cerrada
      const session = service.checkSession();
      expect(session.isValid).toBe(false);
    });

    it('debe resetear temporizador al llamar enforceAutoLogout', async () => {
      // Iniciar sesión
      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Simular actividad reseteando el timer
      const result = service.enforceAutoLogout(15);
      expect(isOk(result)).toBe(true);

      // La sesión debe seguir activa
      const session = service.checkSession();
      expect(session.isValid).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('debe limpiar recursos correctamente', async () => {
      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      service.cleanup();

      // El servicio debe estar limpio
      expect(service).toBeDefined();
    });
  });

  describe('getAuthService singleton', () => {
    it('debe retornar la misma instancia en llamadas múltiples', async () => {
      const instance1 = await getAuthService();
      const instance2 = await getAuthService();
      
      expect(instance1).toBe(instance2);
    });

    it('debe crear nueva instancia después de reset', async () => {
      const instance1 = await getAuthService();
      resetAuthService();
      const instance2 = await getAuthService();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Integration scenarios', () => {
    it('debe manejar flujo completo de login-refresh-logout', async () => {
      // Login
      const loginResult = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(isOk(loginResult)).toBe(true);

      // Verificar sesión
      let session = service.checkSession();
      expect(session.isValid).toBe(true);

      // Refresh token
      const refreshToken = LocalStorageUtils.getItem<string>('refresh_token');
      const refreshResult = await service.refreshToken(refreshToken!);
      expect(isOk(refreshResult)).toBe(true);

      // Verificar sesión después de refresh
      session = service.checkSession();
      expect(session.isValid).toBe(true);

      // Logout
      const logoutResult = await service.logout();
      expect(isOk(logoutResult)).toBe(true);

      // Verificar sesión después de logout
      session = service.checkSession();
      expect(session.isValid).toBe(false);
    });

    it('debe mantener sesión activa con resets periódicos del temporizador', async () => {
      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Simular actividad reseteando el timer múltiples veces
      for (let i = 0; i < 5; i++) {
        service.enforceAutoLogout(15);
      }

      // La sesión debe seguir activa
      const session = service.checkSession();
      expect(session.isValid).toBe(true);
    });
  });
});
