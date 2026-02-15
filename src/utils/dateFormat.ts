/**
 * Utilidades de formato de fecha para Chile
 * 
 * Este módulo proporciona funciones para formatear fechas
 * en el formato chileno estándar (DD/MM/YYYY).
 */

/**
 * Formatea una fecha en el formato chileno DD/MM/YYYY
 * 
 * @param date - La fecha a formatear
 * @returns La fecha formateada como string en formato DD/MM/YYYY
 * 
 * @example
 * ```typescript
 * const fecha = new Date(2024, 0, 15); // 15 de enero de 2024
 * formatDateChile(fecha); // "15/01/2024"
 * ```
 */
export function formatDateChile(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}
