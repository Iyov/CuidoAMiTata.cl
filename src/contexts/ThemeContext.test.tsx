import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';
import React from 'react';

// Requisitos: 8.1, 8.2, 8.5

describe('ThemeContext - Pruebas Unitarias', () => {
  const THEME_STORAGE_KEY = 'cuido-a-mi-tata-theme';

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('Requisito 8.1: Modo oscuro por defecto', () => {
    it('debe mostrar modo oscuro por defecto al iniciar', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('debe aplicar clase "dark" al elemento html cuando el tema es oscuro', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('debe guardar "dark" en localStorage por defecto', () => {
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      expect(storedTheme).toBe('dark');
    });
  });

  describe('Requisito 8.2: Alternancia entre modo claro y oscuro', () => {
    it('debe alternar de oscuro a claro cuando se llama toggleTheme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('debe alternar de claro a oscuro cuando se llama toggleTheme dos veces', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.toggleTheme(); // dark -> light
      });

      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme(); // light -> dark
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('debe permitir cambiar a modo claro usando setTheme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('debe permitir cambiar a modo oscuro usando setTheme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('debe remover clase "dark" del html cuando el tema es claro', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Requisito 8.5: Persistencia de preferencia', () => {
    it('debe persistir el tema en localStorage cuando cambia a claro', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });

      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      expect(storedTheme).toBe('light');
    });

    it('debe persistir el tema en localStorage cuando cambia a oscuro', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.setTheme('dark');
      });

      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      expect(storedTheme).toBe('dark');
    });

    it('debe restaurar el tema guardado después de reload (simulado)', () => {
      // Primera sesión: guardar tema claro
      const { unmount } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      const { result: firstResult } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        firstResult.current.setTheme('light');
      });

      unmount();

      // Simular reload: crear nueva instancia
      const { result: secondResult } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      // Verificar que se restauró el tema claro
      expect(secondResult.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('debe restaurar tema oscuro guardado después de reload (simulado)', () => {
      // Guardar tema oscuro explícitamente
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');

      // Crear nueva instancia (simula reload)
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('debe persistir múltiples cambios de tema', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      // Cambio 1: dark -> light
      act(() => {
        result.current.toggleTheme();
      });
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

      // Cambio 2: light -> dark
      act(() => {
        result.current.toggleTheme();
      });
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

      // Cambio 3: dark -> light
      act(() => {
        result.current.toggleTheme();
      });
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    });
  });

  describe('Manejo de errores', () => {
    it('debe lanzar error si useTheme se usa fuera de ThemeProvider', () => {
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme debe usarse dentro de un ThemeProvider');
    });
  });
});
