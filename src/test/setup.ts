/**
 * Configuración de pruebas para Vitest
 */

// Mock de IndexedDB para entorno de pruebas
import 'fake-indexeddb/auto';

// Importar matchers de jest-dom para testing-library
import '@testing-library/jest-dom/vitest';

// Mock de LocalStorage si es necesario
const localStorageMock = {
  getItem: (key: string) => {
    return (localStorageMock as any)[key] || null;
  },
  setItem: (key: string, value: string) => {
    (localStorageMock as any)[key] = value;
  },
  removeItem: (key: string) => {
    delete (localStorageMock as any)[key];
  },
  clear: () => {
    Object.keys(localStorageMock).forEach((key) => {
      if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
        delete (localStorageMock as any)[key];
      }
    });
  },
};

(globalThis as any).localStorage = localStorageMock as Storage;
