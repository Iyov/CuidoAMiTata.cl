/**
 * Auth Service
 * Servicio de autenticación usando Supabase
 */

import { getSupabaseAuthService, resetSupabaseAuthService } from './SupabaseAuthService';
import type { Result } from '../types/result';
import type { AuthToken, Credentials, SessionStatus } from '../types/models';

/**
 * Interfaz unificada de autenticación
 */
export interface IAuthService {
  initialize(): Promise<Result<void>>;
  login(credentials: Credentials): Promise<Result<AuthToken>>;
  register(credentials: Credentials): Promise<Result<AuthToken>>;
  logout(): Promise<Result<void>>;
  isAuthenticated(): Promise<boolean>;
  checkSession(): SessionStatus;
  cleanup(): void;
}

/**
 * Obtiene el servicio de autenticación con Supabase
 */
export async function getAuthService(): Promise<IAuthService> {
  return await getSupabaseAuthService();
}

/**
 * Resetea el servicio de autenticación
 */
export function resetAuthService(): void {
  resetSupabaseAuthService();
}
