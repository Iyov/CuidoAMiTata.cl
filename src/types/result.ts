import { ErrorCode } from './enums';

/**
 * Tipo Result para manejo de errores funcional
 * Inspirado en Rust's Result<T, E>
 */
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Error de aplicación con código y mensaje
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

/**
 * Crea un Result exitoso
 */
export function Ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * Crea un Result con error
 */
export function Err<E = AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Verifica si un Result es exitoso
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true;
}

/**
 * Verifica si un Result es un error
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}

/**
 * Extrae el valor de un Result o lanza un error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw new Error(`Unwrap called on Err: ${JSON.stringify(result.error)}`);
}

/**
 * Extrae el valor de un Result o devuelve un valor por defecto
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

/**
 * Mapea el valor de un Result exitoso
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isOk(result)) {
    return { ok: true, value: fn(result.value) };
  }
  return result as Result<U, E>;
}

/**
 * Mapea el error de un Result fallido
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isErr(result) ? Err(fn(result.error)) : result;
}
