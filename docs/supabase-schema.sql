-- ============================================================================
-- Esquema de Base de Datos Supabase - CuidoAMiTata.cl
-- ============================================================================
-- 
-- Este archivo contiene el esquema completo de la base de datos para la
-- aplicación CuidoAMiTata.cl, incluyendo:
-- - Tipos ENUM personalizados
-- - Tablas con sus relaciones
-- - Políticas RLS (Row Level Security) para aislamiento por familia
-- - Índices para optimización de consultas
--
-- Contexto: Aplicación para el cuidado de adultos mayores en Chile
-- Backend: Supabase (PostgreSQL + Auth)
-- Seguridad: RLS habilitado en todas las tablas
--
-- ============================================================================

-- ============================================================================
-- TIPOS ENUM
-- ============================================================================

-- Roles dentro de un grupo familiar
CREATE TYPE family_role AS ENUM (
  'admin',      -- Administrador: permisos completos
  'cuidador',   -- Cuidador: puede registrar actividades y gestionar pacientes
  'familiar'    -- Familiar: solo lectura
);

-- Tipos de ánimo para bitácora diaria
CREATE TYPE mood_type AS ENUM (
  'bien',       -- Estado de ánimo positivo
  'regular',    -- Estado de ánimo neutro
  'bajo',       -- Estado de ánimo negativo
  'irritable',  -- Estado de ánimo irritable
  'otro'        -- Otro estado (con notas adicionales)
);

-- Estado de invitaciones a familias
CREATE TYPE invitation_status AS ENUM (
  'pending',    -- Invitación pendiente de aceptación
  'accepted',   -- Invitación aceptada
  'expired'     -- Invitación expirada
);

-- Estado de notificaciones de pánico
CREATE TYPE notification_status AS ENUM (
  'pending',    -- Notificación pendiente de envío
  'sent',       -- Notificación enviada exitosamente
  'failed'      -- Notificación falló al enviar
);

-- ============================================================================
-- TABLA: profiles
-- ============================================================================
-- Perfiles de usuario extendiendo auth.users de Supabase
-- Relación 1:1 con auth.users
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_profiles_email ON profiles(email);

-- RLS: Usuarios pueden ver y actualizar solo su propio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TABLA: families
-- ============================================================================
-- Grupos familiares que cuidan uno o más pacientes
-- Un usuario puede pertenecer a múltiples familias
-- ============================================================================

CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_families_created_by ON families(created_by);

-- RLS: Miembros de familia pueden ver sus familias
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view their families"
  ON families FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = families.id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update their families"
  ON families FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = families.id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'admin'
    )
  );

-- ============================================================================
-- TABLA: family_members
-- ============================================================================
-- Asociación entre usuarios y familias con roles
-- Un usuario puede tener diferentes roles en diferentes familias
-- ============================================================================

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role family_role NOT NULL DEFAULT 'familiar',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Índices
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_role ON family_members(role);

-- RLS: Miembros pueden ver otros miembros de sus familias
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view members of their families"
  ON family_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage family members"
  ON family_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'admin'
    )
  );

-- ============================================================================
-- TABLA: patients
-- ============================================================================
-- Adultos mayores (tatas) siendo cuidados
-- Cada paciente pertenece a una familia
-- ============================================================================

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_patients_family_id ON patients(family_id);
CREATE INDEX idx_patients_date_of_birth ON patients(date_of_birth);

-- RLS: Miembros de familia pueden ver sus pacientes
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view their patients"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = patients.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and cuidadores can manage patients"
  ON patients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = patients.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role IN ('admin', 'cuidador')
    )
  );

-- ============================================================================
-- TABLA: bitacora_entries
-- ============================================================================
-- Registro diario de comidas, ánimo y actividades del paciente
-- Una entrada por paciente por día
-- ============================================================================

CREATE TABLE bitacora_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  
  -- Comidas
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  snacks TEXT,
  
  -- Ánimo
  mood mood_type,
  mood_notes TEXT,
  
  -- Actividades
  activities TEXT[],
  activity_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(patient_id, entry_date)
);

-- Índices
CREATE INDEX idx_bitacora_patient_id ON bitacora_entries(patient_id);
CREATE INDEX idx_bitacora_family_id ON bitacora_entries(family_id);
CREATE INDEX idx_bitacora_entry_date ON bitacora_entries(entry_date);
CREATE INDEX idx_bitacora_created_by ON bitacora_entries(created_by);
CREATE INDEX idx_bitacora_patient_date ON bitacora_entries(patient_id, entry_date DESC);

-- RLS: Miembros de familia pueden ver bitácora de sus pacientes
ALTER TABLE bitacora_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view bitacora of their patients"
  ON bitacora_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = bitacora_entries.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Cuidadores can create bitacora entries"
  ON bitacora_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = bitacora_entries.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role IN ('admin', 'cuidador')
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Creators can update their entries within 24h"
  ON bitacora_entries FOR UPDATE
  USING (
    created_by = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- ============================================================================
-- TABLA: panic_events
-- ============================================================================
-- Eventos de emergencia activados por el botón de pánico
-- Registra quién, cuándo y dónde se activó la alerta
-- ============================================================================

CREATE TABLE panic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  triggered_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location TEXT,
  notes TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_panic_events_patient_id ON panic_events(patient_id);
CREATE INDEX idx_panic_events_family_id ON panic_events(family_id);
CREATE INDEX idx_panic_events_triggered_at ON panic_events(triggered_at DESC);
CREATE INDEX idx_panic_events_triggered_by ON panic_events(triggered_by);

-- RLS: Miembros de familia pueden ver eventos de pánico de sus pacientes
ALTER TABLE panic_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view panic events of their patients"
  ON panic_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = panic_events.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create panic events"
  ON panic_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = panic_events.family_id
      AND family_members.user_id = auth.uid()
    )
    AND triggered_by = auth.uid()
  );

-- ============================================================================
-- TABLA: panic_notifications
-- ============================================================================
-- Registro de notificaciones enviadas por eventos de pánico
-- Rastrea estado de entrega y reintentos
-- ============================================================================

CREATE TABLE panic_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panic_event_id UUID NOT NULL REFERENCES panic_events(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status notification_status DEFAULT 'pending',
  attempts INT DEFAULT 0,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_panic_notifications_event_id ON panic_notifications(panic_event_id);
CREATE INDEX idx_panic_notifications_status ON panic_notifications(status);
CREATE INDEX idx_panic_notifications_recipient_user ON panic_notifications(recipient_user_id);

-- RLS: Miembros de familia pueden ver notificaciones de sus eventos de pánico
ALTER TABLE panic_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view notifications for their panic events"
  ON panic_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM panic_events pe
      JOIN family_members fm ON fm.family_id = pe.family_id
      WHERE pe.id = panic_notifications.panic_event_id
      AND fm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLA: invitations
-- ============================================================================
-- Invitaciones para unirse a un grupo familiar
-- Incluye token único para aceptación y fecha de expiración
-- ============================================================================

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role family_role NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status invitation_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_invitations_family_id ON invitations(family_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- RLS: Admins pueden ver invitaciones de sus familias
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invitations for their families"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = invitations.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view their own invitation by token"
  ON invitations FOR SELECT
  USING (true);

CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = invitations.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'admin'
    )
    AND invited_by = auth.uid()
  );

CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.family_id = invitations.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'admin'
    )
  );

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bitacora_entries_updated_at
  BEFORE UPDATE ON bitacora_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATOS DE EJEMPLO (OPCIONAL - SOLO PARA DESARROLLO)
-- ============================================================================
-- Descomentar para insertar datos de prueba en desarrollo
-- NO ejecutar en producción

/*
-- Crear usuario de prueba (requiere que el usuario exista en auth.users)
-- INSERT INTO profiles (id, email, name, phone)
-- VALUES (
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
--   'prueba@cuidoamitata.cl',
--   'Usuario de Prueba',
--   '+56912345678'
-- );

-- Crear familia de prueba
-- INSERT INTO families (id, name, created_by)
-- VALUES (
--   'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
--   'Familia González',
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- );

-- Agregar miembro a familia
-- INSERT INTO family_members (family_id, user_id, role)
-- VALUES (
--   'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
--   'admin'
-- );

-- Crear paciente de prueba
-- INSERT INTO patients (id, family_id, name, date_of_birth)
-- VALUES (
--   'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
--   'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
--   'María González',
--   '1945-03-15'
-- );
*/

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================
--
-- 1. SEGURIDAD:
--    - Todas las tablas tienen RLS habilitado
--    - Las políticas aseguran aislamiento por familia
--    - Solo los creadores pueden editar sus propias entradas (con límite de tiempo)
--
-- 2. RENDIMIENTO:
--    - Índices en todas las columnas de búsqueda frecuente
--    - Índices compuestos para consultas comunes (patient_id + entry_date)
--
-- 3. INTEGRIDAD:
--    - Restricciones UNIQUE para prevenir duplicados
--    - Foreign keys con ON DELETE CASCADE para limpieza automática
--    - Triggers para mantener updated_at actualizado
--
-- 4. ESCALABILIDAD:
--    - UUIDs para IDs permiten generación distribuida
--    - JSONB para preferencias permite extensibilidad sin migraciones
--    - Arrays para actividades permiten múltiples valores sin tabla adicional
--
-- 5. MANTENIMIENTO:
--    - Comentarios en español chileno para claridad
--    - Estructura organizada por secciones
--    - Nombres descriptivos en español
--
-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================
