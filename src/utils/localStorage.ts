/**
 * LocalStorage utilities para preferencias y configuración
 */

const PREFIX = 'cuidoamitata_';

/**
 * Guarda un valor en LocalStorage
 */
export function setItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(PREFIX + key, serialized);
  } catch (error) {
    console.error(`Error saving to localStorage: ${key}`, error);
  }
}

/**
 * Obtiene un valor de LocalStorage
 */
export function getItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(PREFIX + key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return null;
  }
}

/**
 * Elimina un valor de LocalStorage
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (error) {
    console.error(`Error removing from localStorage: ${key}`, error);
  }
}

/**
 * Limpia todos los valores con el prefijo de la aplicación
 */
export function clear(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing localStorage', error);
  }
}

/**
 * Verifica si existe una clave
 */
export function hasItem(key: string): boolean {
  return localStorage.getItem(PREFIX + key) !== null;
}

/**
 * Obtiene todas las claves con el prefijo de la aplicación
 */
export function getAllKeys(): string[] {
  try {
    const keys = Object.keys(localStorage);
    return keys.filter((key) => key.startsWith(PREFIX)).map((key) => key.replace(PREFIX, ''));
  } catch (error) {
    console.error('Error getting all keys from localStorage', error);
    return [];
  }
}

/**
 * Obtiene el tamaño aproximado usado en bytes
 */
export function getStorageSize(): number {
  try {
    let total = 0;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          total += item.length + key.length;
        }
      }
    });
    return total;
  } catch (error) {
    console.error('Error calculating storage size', error);
    return 0;
  }
}

// Claves específicas de la aplicación
export const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'language',
  USER_PREFERENCES: 'user_preferences',
  SELECTED_PATIENT: 'selected_patient',
  AUTH_TOKEN: 'auth_token',
  LAST_SYNC: 'last_sync',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
} as const;
