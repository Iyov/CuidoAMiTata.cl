import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FamilySelector } from './FamilySelector';
import type { Family } from '../types/models';

describe('FamilySelector', () => {
  const mockFamilies: Family[] = [
    {
      id: 'family-1',
      name: 'Familia González',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'family-2',
      name: 'Familia Pérez',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'family-3',
      name: 'Familia Rodríguez',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  it('no se muestra cuando el usuario tiene solo una familia', () => {
    const singleFamily = [mockFamilies[0]];
    const { container } = render(
      <FamilySelector
        families={singleFamily}
        currentFamilyId="family-1"
        onFamilyChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('no se muestra cuando el usuario no tiene familias', () => {
    const { container } = render(
      <FamilySelector
        families={[]}
        currentFamilyId={null}
        onFamilyChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('se muestra cuando el usuario tiene múltiples familias', () => {
    render(
      <FamilySelector
        families={mockFamilies}
        currentFamilyId="family-1"
        onFamilyChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/familia/i)).toBeInTheDocument();
  });

  it('muestra el nombre de la familia actual seleccionada', () => {
    render(
      <FamilySelector
        families={mockFamilies}
        currentFamilyId="family-2"
        onFamilyChange={vi.fn()}
      />
    );

    const select = screen.getByLabelText(/seleccionar familia/i) as HTMLSelectElement;
    expect(select.value).toBe('family-2');
    
    // Verificar que la opción seleccionada es la correcta
    const selectedOption = select.options[select.selectedIndex];
    expect(selectedOption.text).toBe('Familia Pérez');
  });

  it('muestra todas las familias disponibles en el dropdown', () => {
    render(
      <FamilySelector
        families={mockFamilies}
        currentFamilyId="family-1"
        onFamilyChange={vi.fn()}
      />
    );

    const select = screen.getByLabelText(/seleccionar familia/i) as HTMLSelectElement;
    const options = Array.from(select.options);

    expect(options).toHaveLength(3);
    expect(options[0].text).toBe('Familia González');
    expect(options[1].text).toBe('Familia Pérez');
    expect(options[2].text).toBe('Familia Rodríguez');
  });

  it('llama a onFamilyChange cuando se selecciona una familia diferente', async () => {
    const user = userEvent.setup();
    const handleFamilyChange = vi.fn();

    render(
      <FamilySelector
        families={mockFamilies}
        currentFamilyId="family-1"
        onFamilyChange={handleFamilyChange}
      />
    );

    const select = screen.getByLabelText(/seleccionar familia/i);
    await user.selectOptions(select, 'family-3');

    expect(handleFamilyChange).toHaveBeenCalledWith('family-3');
    expect(handleFamilyChange).toHaveBeenCalledTimes(1);
  });

  it('no llama a onFamilyChange cuando se selecciona la misma familia', async () => {
    const user = userEvent.setup();
    const handleFamilyChange = vi.fn();

    render(
      <FamilySelector
        families={mockFamilies}
        currentFamilyId="family-1"
        onFamilyChange={handleFamilyChange}
      />
    );

    const select = screen.getByLabelText(/seleccionar familia/i);
    await user.selectOptions(select, 'family-1');

    expect(handleFamilyChange).not.toHaveBeenCalled();
  });

  it('está deshabilitado cuando isLoading es true', () => {
    render(
      <FamilySelector
        families={mockFamilies}
        currentFamilyId="family-1"
        onFamilyChange={vi.fn()}
        isLoading={true}
      />
    );

    const select = screen.getByLabelText(/seleccionar familia/i);
    expect(select).toBeDisabled();
  });

  it('tiene el atributo aria-busy cuando está cargando', () => {
    render(
      <FamilySelector
        families={mockFamilies}
        currentFamilyId="family-1"
        onFamilyChange={vi.fn()}
        isLoading={true}
      />
    );

    const select = screen.getByLabelText(/seleccionar familia/i);
    expect(select).toHaveAttribute('aria-busy', 'true');
  });

  it('tiene tamaño táctil mínimo de 44px para accesibilidad', () => {
    render(
      <FamilySelector
        families={mockFamilies}
        currentFamilyId="family-1"
        onFamilyChange={vi.fn()}
      />
    );

    const select = screen.getByLabelText(/seleccionar familia/i);
    const styles = window.getComputedStyle(select);
    
    // Verificar que tiene la clase min-h-[44px]
    expect(select.className).toContain('min-h-[44px]');
  });

  it('incluye texto accesible para lectores de pantalla', () => {
    render(
      <FamilySelector
        families={mockFamilies}
        currentFamilyId="family-2"
        onFamilyChange={vi.fn()}
      />
    );

    // Verificar que existe el texto para lectores de pantalla
    const srText = screen.getByText(/familia actual: familia pérez/i);
    expect(srText).toHaveClass('sr-only');
  });
});
