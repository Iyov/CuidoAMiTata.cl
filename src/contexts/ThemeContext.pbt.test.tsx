import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { ThemeProvider, useTheme } from './ThemeContext';
import React from 'react';

// Feature: cuido-a-mi-tata, Property 21: Persistencia de preferencia de tema
// Valida: Requisitos 8.5

describe('Propiedad 21: Persistencia de preferencia de tema', () => {
  const THEME_STORAGE_KEY = 'cuido-a-mi-tata-theme';

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('Para cualquier cambio de modo de visualización (claro/oscuro), el sistema debe persistir la preferencia y restaurarla en la próxima sesión', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('dark' as const, 'light' as const), { minLength: 1, maxLength: 10 }),
        (themeSequence) => {
          // Limpiar estado antes de cada iteración
          localStorage.clear();
          document.documentElement.classList.remove('dark');

          let lastTheme: 'dark' | 'light' = 'dark'; // Tema por defecto

          // Simular una secuencia de cambios de tema
          for (const targetTheme of themeSequence) {
            // Renderizar el hook con ThemeProvider
            const { result, unmount } = renderHook(() => useTheme(), {
              wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
            });

            // Cambiar al tema objetivo
            act(() => {
              result.current.setTheme(targetTheme);
            });

            // Verificar que el tema se aplicó
            expect(result.current.theme).toBe(targetTheme);

            // Verificar que se persistió en localStorage
            const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            expect(storedTheme).toBe(targetTheme);

            // Verificar que se aplicó al documento
            if (targetTheme === 'dark') {
              expect(document.documentElement.classList.contains('dark')).toBe(true);
            } else {
              expect(document.documentElement.classList.contains('dark')).toBe(false);
            }

            lastTheme = targetTheme;
            unmount();
          }

          // Simular "próxima sesión" - crear nueva instancia del hook
          const { result: newResult } = renderHook(() => useTheme(), {
            wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
          });

          // Verificar que el tema se restauró correctamente
          expect(newResult.current.theme).toBe(lastTheme);

          // Verificar que el tema restaurado está en localStorage
          const restoredTheme = localStorage.getItem(THEME_STORAGE_KEY);
          expect(restoredTheme).toBe(lastTheme);

          // Verificar que se aplicó al documento
          if (lastTheme === 'dark') {
            expect(document.documentElement.classList.contains('dark')).toBe(true);
          } else {
            expect(document.documentElement.classList.contains('dark')).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('El sistema debe usar modo oscuro por defecto cuando no hay preferencia guardada', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // Asegurar que no hay preferencia guardada
          localStorage.clear();
          document.documentElement.classList.remove('dark');

          // Renderizar el hook
          const { result } = renderHook(() => useTheme(), {
            wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
          });

          // Verificar que el tema por defecto es oscuro
          expect(result.current.theme).toBe('dark');

          // Verificar que se aplicó al documento
          expect(document.documentElement.classList.contains('dark')).toBe(true);

          // Verificar que se persistió
          const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
          expect(storedTheme).toBe('dark');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('El toggleTheme debe alternar correctamente entre claro y oscuro', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (toggleCount) => {
          localStorage.clear();
          document.documentElement.classList.remove('dark');

          const { result } = renderHook(() => useTheme(), {
            wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
          });

          let expectedTheme: 'dark' | 'light' = 'dark'; // Tema inicial

          // Realizar múltiples toggles
          for (let i = 0; i < toggleCount; i++) {
            act(() => {
              result.current.toggleTheme();
            });

            // Alternar el tema esperado
            expectedTheme = expectedTheme === 'dark' ? 'light' : 'dark';

            // Verificar que el tema cambió correctamente
            expect(result.current.theme).toBe(expectedTheme);

            // Verificar persistencia
            const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            expect(storedTheme).toBe(expectedTheme);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
