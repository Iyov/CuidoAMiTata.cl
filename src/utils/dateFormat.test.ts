import { describe, it, expect } from 'vitest';
import { formatDateChile } from './dateFormat';

describe('formatDateChile', () => {
  it('formatea correctamente una fecha en formato DD/MM/YYYY', () => {
    const fecha = new Date(2024, 0, 15); // 15 de enero de 2024
    expect(formatDateChile(fecha)).toBe('15/01/2024');
  });

  it('agrega ceros a la izquierda para días de un dígito', () => {
    const fecha = new Date(2024, 5, 5); // 5 de junio de 2024
    expect(formatDateChile(fecha)).toBe('05/06/2024');
  });

  it('agrega ceros a la izquierda para meses de un dígito', () => {
    const fecha = new Date(2024, 0, 25); // 25 de enero de 2024
    expect(formatDateChile(fecha)).toBe('25/01/2024');
  });

  it('maneja correctamente el último día del mes', () => {
    const fecha = new Date(2024, 11, 31); // 31 de diciembre de 2024
    expect(formatDateChile(fecha)).toBe('31/12/2024');
  });

  it('maneja correctamente el primer día del año', () => {
    const fecha = new Date(2024, 0, 1); // 1 de enero de 2024
    expect(formatDateChile(fecha)).toBe('01/01/2024');
  });

  it('maneja correctamente años con cuatro dígitos', () => {
    const fecha = new Date(2000, 5, 15); // 15 de junio de 2000
    expect(formatDateChile(fecha)).toBe('15/06/2000');
  });
});
