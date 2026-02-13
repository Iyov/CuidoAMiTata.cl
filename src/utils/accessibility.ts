/**
 * Utilidades de accesibilidad
 */

/**
 * Convierte un color hexadecimal a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calcula la luminancia relativa de un color
 * Según WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula el ratio de contraste entre dos colores
 * Según WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return null;
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Verifica si el contraste cumple con WCAG AA (4.5:1 para texto normal, 3:1 para texto grande)
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  if (ratio === null) return false;

  const minimumRatio = isLargeText ? 3 : 4.5;
  return ratio >= minimumRatio;
}

/**
 * Verifica si el contraste cumple con WCAG AAA (7:1 para texto normal, 4.5:1 para texto grande)
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  if (ratio === null) return false;

  const minimumRatio = isLargeText ? 4.5 : 7;
  return ratio >= minimumRatio;
}

/**
 * Colores del tema con verificación de contraste
 */
export const themeColors = {
  light: {
    background: '#ffffff',
    text: '#0f172a', // slate-900
    primary: '#10b981', // emerald-500
    secondary: '#e2e8f0', // slate-200
    danger: '#ef4444', // red-500
    success: '#22c55e', // green-500
  },
  dark: {
    background: '#0f172a', // slate-900
    text: '#ffffff',
    primary: '#10b981', // emerald-500
    secondary: '#475569', // slate-600
    danger: '#ef4444', // red-500
    success: '#22c55e', // green-500
  },
};

/**
 * Verifica el contraste de todos los colores del tema
 */
export function verifyThemeContrast(): {
  light: Record<string, { ratio: number | null; meetsAA: boolean; meetsAAA: boolean }>;
  dark: Record<string, { ratio: number | null; meetsAA: boolean; meetsAAA: boolean }>;
} {
  const results = {
    light: {} as Record<string, { ratio: number | null; meetsAA: boolean; meetsAAA: boolean }>,
    dark: {} as Record<string, { ratio: number | null; meetsAA: boolean; meetsAAA: boolean }>,
  };

  // Verificar tema claro
  Object.entries(themeColors.light).forEach(([key, color]) => {
    if (key !== 'background' && key !== 'text') {
      const ratio = getContrastRatio(color, themeColors.light.background);
      results.light[key] = {
        ratio,
        meetsAA: meetsWCAGAA(color, themeColors.light.background),
        meetsAAA: meetsWCAGAAA(color, themeColors.light.background),
      };
    }
  });

  // Verificar tema oscuro
  Object.entries(themeColors.dark).forEach(([key, color]) => {
    if (key !== 'background' && key !== 'text') {
      const ratio = getContrastRatio(color, themeColors.dark.background);
      results.dark[key] = {
        ratio,
        meetsAA: meetsWCAGAA(color, themeColors.dark.background),
        meetsAAA: meetsWCAGAAA(color, themeColors.dark.background),
      };
    }
  });

  return results;
}

/**
 * Genera un ID único para elementos ARIA
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Anuncia un mensaje a lectores de pantalla
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Eliminar después de que el lector de pantalla lo haya leído
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Clase CSS para elementos solo visibles para lectores de pantalla
 */
export const srOnlyClass = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';
