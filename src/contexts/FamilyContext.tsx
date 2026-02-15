import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Family, FamilyMember } from '../types/models';
import { getFamilyManager } from '../services/FamilyManager';
import { supabase } from '../config/supabase';

interface FamilyContextValue {
  currentFamily: Family | null;
  families: Family[];
  members: FamilyMember[];
  isLoading: boolean;
  switchFamily: (familyId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

const FAMILY_STORAGE_KEY = 'cuido-a-mi-tata-current-family';

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const familyManager = getFamilyManager();

  /**
   * Carga las familias del usuario actual
   */
  const loadUserFamilies = useCallback(async () => {
    try {
      // Obtener usuario actual de Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setFamilies([]);
        setCurrentFamily(null);
        setMembers([]);
        setIsLoading(false);
        return;
      }

      // Obtener familias del usuario
      const familiesResult = await familyManager.getUserFamilies(user.id);
      
      if (!familiesResult.ok) {
        console.error('Error al cargar familias:', familiesResult.error);
        setFamilies([]);
        setCurrentFamily(null);
        setMembers([]);
        setIsLoading(false);
        return;
      }

      const userFamilies = familiesResult.value;
      setFamilies(userFamilies);

      // Si no hay familias, limpiar estado
      if (userFamilies.length === 0) {
        setCurrentFamily(null);
        setMembers([]);
        localStorage.removeItem(FAMILY_STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      // Intentar cargar familia guardada en localStorage
      const savedFamilyId = localStorage.getItem(FAMILY_STORAGE_KEY);
      let familyToSelect: Family | null = null;

      if (savedFamilyId) {
        // Verificar que la familia guardada existe en las familias del usuario
        familyToSelect = userFamilies.find(f => f.id === savedFamilyId) || null;
      }

      // Si no hay familia guardada o no es válida, seleccionar la primera
      if (!familyToSelect && userFamilies.length > 0) {
        familyToSelect = userFamilies[0];
      }

      if (familyToSelect) {
        setCurrentFamily(familyToSelect);
        localStorage.setItem(FAMILY_STORAGE_KEY, familyToSelect.id);
        
        // Cargar miembros de la familia seleccionada
        await loadFamilyMembers(familyToSelect.id);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error al cargar familias del usuario:', error);
      setFamilies([]);
      setCurrentFamily(null);
      setMembers([]);
      setIsLoading(false);
    }
  }, []); // Sin dependencias para evitar loops

  /**
   * Carga los miembros de una familia específica
   */
  const loadFamilyMembers = async (familyId: string) => {
    try {
      const membersResult = await familyManager.getFamilyMembers(familyId);
      
      if (membersResult.ok) {
        setMembers(membersResult.value);
      } else {
        console.error('Error al cargar miembros:', membersResult.error);
        setMembers([]);
      }
    } catch (error) {
      console.error('Error al cargar miembros de familia:', error);
      setMembers([]);
    }
  };

  /**
   * Cambia la familia actual
   */
  const switchFamily = async (familyId: string) => {
    try {
      setIsLoading(true);

      // Buscar la familia en la lista
      const family = families.find(f => f.id === familyId);
      
      if (!family) {
        console.error('Familia no encontrada:', familyId);
        setIsLoading(false);
        return;
      }

      // Actualizar familia actual
      setCurrentFamily(family);
      
      // Persistir en localStorage
      localStorage.setItem(FAMILY_STORAGE_KEY, familyId);

      // Cargar miembros de la nueva familia
      await loadFamilyMembers(familyId);

      setIsLoading(false);
    } catch (error) {
      console.error('Error al cambiar de familia:', error);
      setIsLoading(false);
    }
  };

  /**
   * Recarga los miembros de la familia actual
   */
  const refreshMembers = async () => {
    if (!currentFamily) {
      return;
    }

    await loadFamilyMembers(currentFamily.id);
  };

  // Cargar familias al montar el componente
  useEffect(() => {
    loadUserFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Usuario inició sesión, cargar familias
        loadUserFamilies();
      } else if (event === 'SIGNED_OUT') {
        // Usuario cerró sesión, limpiar estado
        setFamilies([]);
        setCurrentFamily(null);
        setMembers([]);
        localStorage.removeItem(FAMILY_STORAGE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserFamilies]);

  const value: FamilyContextValue = {
    currentFamily,
    families,
    members,
    isLoading,
    switchFamily,
    refreshMembers,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};

/**
 * Hook para usar el contexto de familia
 */
export const useFamily = (): FamilyContextValue => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily debe usarse dentro de un FamilyProvider');
  }
  return context;
};
