import React from 'react';
import type { Family } from '../types/models';

export interface FamilySelectorProps {
  families: Family[];
  currentFamilyId: string | null;
  onFamilyChange: (familyId: string) => void;
  isLoading?: boolean;
}

/**
 * Componente selector de familia
 * 
 * Permite al usuario cambiar entre sus familias cuando pertenece a múltiples grupos.
 * Solo se muestra si el usuario tiene más de una familia.
 * 
 * @param families - Lista de familias del usuario
 * @param currentFamilyId - ID de la familia actualmente seleccionada
 * @param onFamilyChange - Callback cuando se selecciona una familia diferente
 * @param isLoading - Indica si se está cargando información
 */
export const FamilySelector: React.FC<FamilySelectorProps> = ({
  families,
  currentFamilyId,
  onFamilyChange,
  isLoading = false,
}) => {
  // Solo mostrar si el usuario tiene múltiples familias
  if (families.length <= 1) {
    return null;
  }

  const currentFamily = families.find(f => f.id === currentFamilyId);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFamilyId = event.target.value;
    if (selectedFamilyId && selectedFamilyId !== currentFamilyId) {
      onFamilyChange(selectedFamilyId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label 
        htmlFor="family-selector" 
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        Familia:
      </label>
      <select
        id="family-selector"
        value={currentFamilyId || ''}
        onChange={handleChange}
        disabled={isLoading}
        className="
          px-3 py-2 rounded-lg border min-h-[44px]
          border-slate-300 dark:border-slate-600
          bg-white dark:bg-slate-800
          text-slate-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          cursor-pointer
        "
        aria-label="Seleccionar familia"
        aria-busy={isLoading}
      >
        {families.map((family) => (
          <option key={family.id} value={family.id}>
            {family.name}
          </option>
        ))}
      </select>
      {currentFamily && (
        <span className="sr-only">
          Familia actual: {currentFamily.name}
        </span>
      )}
    </div>
  );
};
