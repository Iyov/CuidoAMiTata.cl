/**
 * Configuración de Supabase
 * 
 * Para configurar:
 * 1. Crea un proyecto en https://supabase.com
 * 2. Ve a Settings > API
 * 3. Copia la URL y la anon key
 * 4. Crea un archivo .env.local en la raíz del proyecto
 * 5. Agrega las variables:
 *    VITE_SUPABASE_URL=tu_url_aqui
 *    VITE_SUPABASE_ANON_KEY=tu_key_aqui
 */

import { createClient } from '@supabase/supabase-js';

// Obtener credenciales desde variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// No lanzar error si faltan credenciales: evita pantalla en blanco en producción
// (p. ej. GitHub Pages sin secrets). La auth fallará al intentar login y se mostrará mensaje.
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Crear cliente de Supabase (con placeholders si no hay env para que la app cargue)
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Verifica si Supabase está configurado correctamente
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Tipos de base de datos
 * Actualiza estos tipos según tu esquema de Supabase
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'cuidador' | 'familiar';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'admin' | 'cuidador' | 'familiar';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'cuidador' | 'familiar';
          updated_at?: string;
        };
      };
    };
  };
}
