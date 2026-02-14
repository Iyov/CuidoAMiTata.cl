# Documento de Diseño

## Resumen

Este documento describe el diseño técnico para implementar la identidad chilena y los cuatro servicios centrales de CuidoAMiTata.cl:

1. Identidad Chile en landing y aplicación
2. Bitácora diaria para registro de comidas, ánimo y actividades
3. Soporte multi-familiar con roles y permisos
4. Botón de pánico para alertas de emergencia

El diseño se integra con la arquitectura existente basada en React, TypeScript, Supabase y GitHub Pages.

## Arquitectura

### Visión General

La implementación sigue la arquitectura en capas existente del proyecto:

```
┌─────────────────────────────────────────────────────────────────┐
│                   CAPA DE PRESENTACIÓN                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Landing    │  │   Bitácora   │  │    Familia   │          │
│  │  (Chile)     │  │    Screen    │  │    Screen    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │    Pánico    │  │  Navigation  │                            │
│  │  Component   │  │  (Español)   │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   CAPA DE LÓGICA DE NEGOCIO                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Bitácora   │  │    Family    │  │    Panic     │          │
│  │   Manager    │  │   Manager    │  │   Manager    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE SERVICIOS                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Supabase   │  │Notification  │  │    Email     │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA DE DATOS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Supabase   │  │ LocalStorage │  │  IndexedDB   │          │
│  │  PostgreSQL  │  │(Preferences) │  │   (Cache)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Decisiones de Arquitectura

1. **Backend único**: Supabase como única fuente de verdad para datos persistentes
2. **RLS (Row Level Security)**: Aislamiento de datos por familia en PostgreSQL
3. **Offline-first**: IndexedDB para caché local, sincronización con Supabase
4. **Español chileno**: Todo el contenido visible en español de Chile
5. **GitHub Pages**: Despliegue estático con basename configurado

## Componentes e Interfaces

### 1. Identidad Chile

#### 1.1 Landing Page (index.html)

**Responsabilidad**: Página pública con identidad chilena

**Cambios requeridos**:
- Actualizar meta tags con keywords chilenas
- Reemplazar contenido con referencias a Chile (SENAMA, cuidado familiar chileno)
- Eliminar referencias a España como marco principal
- Mantener estructura HTML existente

**Archivos afectados**:
- `index.html` (raíz)
- `public/index.html` (copia en build)

#### 1.2 Navegación y Textos de Aplicación

**Responsabilidad**: Interfaz en español chileno

**Componentes a actualizar**:
- `src/App.tsx`: Títulos de navegación
- `src/screens/*.tsx`: Textos de pantallas existentes
- Componentes de UI: Botones, mensajes, etiquetas

**Términos chilenos a usar**:
- "tata" / "tata" para abuelo/abuela
- "cuidador" en lugar de "cuidador"
- Formatos de fecha chilenos (DD/MM/YYYY)
- Hora formato 24h

### 2. Bitácora Diaria

#### 2.1 BitacoraScreen

**Responsabilidad**: Pantalla principal de bitácora

**Props**:
```typescript
interface BitacoraScreenProps {
  // Sin props, usa contexto de familia y paciente
}
```

**Estado**:
```typescript
interface BitacoraState {
  selectedDate: Date;
  entries: BitacoraEntry[];
  isLoading: boolean;
  error: string | null;
}
```

**Funcionalidad**:
- Selector de fecha (por defecto: hoy)
- Formulario de entrada para comidas, ánimo, actividades
- Lista de entradas históricas
- Filtrado por paciente
- Edición de entradas (dentro de 24h)

#### 2.2 BitacoraManager

**Responsabilidad**: Lógica de negocio de bitácora

**Interfaz**:
```typescript
interface IBitacoraManager {
  createEntry(entry: BitacoraEntryInput): Promise<Result<BitacoraEntry>>;
  getEntriesByDate(patientId: string, date: Date): Promise<Result<BitacoraEntry[]>>;
  getEntriesByDateRange(patientId: string, start: Date, end: Date): Promise<Result<BitacoraEntry[]>>;
  updateEntry(id: string, updates: Partial<BitacoraEntryInput>): Promise<Result<BitacoraEntry>>;
  canEdit(entry: BitacoraEntry, userId: string): boolean;
}
```

**Validaciones**:
- Fecha no puede ser futura
- Al menos un campo debe estar completo (comida, ánimo o actividad)
- Solo el creador puede editar dentro de 24h

#### 2.3 BitacoraService

**Responsabilidad**: Persistencia en Supabase

**Interfaz**:
```typescript
interface IBitacoraService {
  save(entry: BitacoraEntry): Promise<Result<BitacoraEntry>>;
  findByPatientAndDate(patientId: string, date: Date): Promise<Result<BitacoraEntry[]>>;
  findByPatientAndDateRange(patientId: string, start: Date, end: Date): Promise<Result<BitacoraEntry[]>>;
  update(id: string, updates: Partial<BitacoraEntry>): Promise<Result<BitacoraEntry>>;
}
```

### 3. Multi-Familiar

#### 3.1 FamilyScreen

**Responsabilidad**: Gestión de familia y miembros

**Secciones**:
- Lista de miembros actuales con roles
- Formulario de invitación (email + rol)
- Selector de familia (si usuario pertenece a múltiples)
- Gestión de pacientes del grupo

**Props**:
```typescript
interface FamilyScreenProps {
  // Sin props, usa contexto de usuario
}
```

#### 3.2 FamilySelector Component

**Responsabilidad**: Cambio de contexto familiar

**Props**:
```typescript
interface FamilySelectorProps {
  families: Family[];
  currentFamilyId: string;
  onFamilyChange: (familyId: string) => void;
}
```

**Ubicación**: Header de navegación

#### 3.3 FamilyManager

**Responsabilidad**: Lógica de negocio multi-familiar

**Interfaz**:
```typescript
interface IFamilyManager {
  createFamily(name: string, adminUserId: string): Promise<Result<Family>>;
  inviteMember(familyId: string, email: string, role: FamilyRole): Promise<Result<Invitation>>;
  removeMember(familyId: string, userId: string): Promise<Result<void>>;
  updateMemberRole(familyId: string, userId: string, role: FamilyRole): Promise<Result<void>>;
  getFamilyMembers(familyId: string): Promise<Result<FamilyMember[]>>;
  getUserFamilies(userId: string): Promise<Result<Family[]>>;
  acceptInvitation(invitationId: string, userId: string): Promise<Result<void>>;
}
```

**Validaciones**:
- Solo admins pueden invitar/remover miembros
- No se puede remover al último admin
- Email de invitación debe ser válido
- Roles válidos: admin, cuidador, familiar

#### 3.4 FamilyContext

**Responsabilidad**: Estado global de familia actual

**Interfaz**:
```typescript
interface FamilyContextValue {
  currentFamily: Family | null;
  families: Family[];
  members: FamilyMember[];
  isLoading: boolean;
  switchFamily: (familyId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
}
```

### 4. Botón de Pánico

#### 4.1 PanicButton Component

**Responsabilidad**: Botón de emergencia visible

**Props**:
```typescript
interface PanicButtonProps {
  patientId: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'fixed' | 'inline';
}
```

**Comportamiento**:
- Botón rojo prominente con ícono de alerta
- Al presionar: muestra diálogo de confirmación
- Al confirmar: registra evento y envía notificaciones
- Feedback visual de éxito/error

**Ubicación**:
- Pantalla principal (HomePage)
- Pantallas de cuidado crítico (medicación, caídas)

#### 4.2 PanicManager

**Responsabilidad**: Lógica de emergencias

**Interfaz**:
```typescript
interface IPanicManager {
  triggerPanic(patientId: string, userId: string, location?: string): Promise<Result<PanicEvent>>;
  getPanicHistory(patientId: string): Promise<Result<PanicEvent[]>>;
  notifyFamilyMembers(panicEvent: PanicEvent): Promise<Result<NotificationResult[]>>;
}
```

**Flujo**:
1. Usuario presiona botón
2. Confirmación requerida
3. Registro en Supabase (tabla panic_events)
4. Obtención de contactos de familia
5. Envío de emails a todos los miembros
6. Registro de estado de notificaciones
7. Feedback al usuario

#### 4.3 EmailService

**Responsabilidad**: Envío de notificaciones por email

**Interfaz**:
```typescript
interface IEmailService {
  sendPanicAlert(recipients: string[], panicEvent: PanicEvent): Promise<Result<EmailResult[]>>;
  sendInvitation(email: string, invitation: Invitation): Promise<Result<EmailResult>>;
}
```

**Implementación**:
- Usar Supabase Edge Functions para envío de emails
- Plantillas HTML para emails
- Reintentos automáticos (hasta 3 veces)
- Registro de estado de entrega

### 5. Autenticación y Perfiles

#### 5.1 Actualización de ProfileService

**Responsabilidad**: Gestión de perfiles con familia

**Interfaz extendida**:
```typescript
interface IProfileService {
  // Métodos existentes...
  
  // Nuevos métodos
  updateFamilyAssociation(userId: string, familyId: string): Promise<Result<void>>;
  getUserRole(userId: string, familyId: string): Promise<Result<FamilyRole>>;
}
```

#### 5.2 Actualización de AuthScreen

**Cambios**:
- Textos en español chileno
- Opción de registro con invitación (token en URL)
- Creación automática de perfil al registrar

## Modelos de Datos

### Esquema de Supabase

#### Tabla: profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### Tabla: families

```sql
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
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
```

#### Tabla: family_members

```sql
CREATE TYPE family_role AS ENUM ('admin', 'cuidador', 'familiar');

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role family_role NOT NULL DEFAULT 'familiar',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- RLS
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
```

#### Tabla: patients

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
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
```

#### Tabla: bitacora_entries

```sql
CREATE TYPE mood_type AS ENUM ('bien', 'regular', 'bajo', 'irritable', 'otro');

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

-- RLS
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
```

#### Tabla: panic_events

```sql
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

-- RLS
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
```

#### Tabla: panic_notifications

```sql
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

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

-- RLS
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
```

#### Tabla: invitations

```sql
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

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

-- RLS
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
```

### Tipos TypeScript

#### Nuevos tipos en src/types/models.ts

```typescript
/**
 * Rol en familia
 */
export type FamilyRole = 'admin' | 'cuidador' | 'familiar';

/**
 * Familia
 */
export interface Family {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Miembro de familia
 */
export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: FamilyRole;
  joinedAt: Date;
}

/**
 * Tipo de ánimo
 */
export type MoodType = 'bien' | 'regular' | 'bajo' | 'irritable' | 'otro';

/**
 * Entrada de bitácora
 */
export interface BitacoraEntry {
  id: string;
  patientId: string;
  familyId: string;
  createdBy: string;
  entryDate: Date;
  
  // Comidas
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
  
  // Ánimo
  mood?: MoodType;
  moodNotes?: string;
  
  // Actividades
  activities?: string[];
  activityNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input para crear entrada de bitácora
 */
export interface BitacoraEntryInput {
  patientId: string;
  entryDate: Date;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
  mood?: MoodType;
  moodNotes?: string;
  activities?: string[];
  activityNotes?: string;
}

/**
 * Evento de pánico
 */
export interface PanicEvent {
  id: string;
  patientId: string;
  familyId: string;
  triggeredBy: string;
  location?: string;
  notes?: string;
  triggeredAt: Date;
  createdAt: Date;
}

/**
 * Notificación de pánico
 */
export interface PanicNotification {
  id: string;
  panicEventId: string;
  recipientEmail: string;
  recipientUserId?: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

/**
 * Invitación a familia
 */
export interface Invitation {
  id: string;
  familyId: string;
  email: string;
  role: FamilyRole;
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

/**
 * Resultado de envío de email
 */
export interface EmailResult {
  recipient: string;
  success: boolean;
  error?: string;
}

/**
 * Resultado de notificación
 */
export interface NotificationResult {
  notificationId: string;
  recipient: string;
  status: 'sent' | 'failed';
  error?: string;
}
```

## Manejo de Errores

### Estrategia

El sistema usa el patrón Result para manejo de errores:

```typescript
type Result<T, E = Error> = Ok<T> | Err<E>;
```

### Códigos de Error

```typescript
enum ErrorCode {
  // Bitácora
  BITACORA_FUTURE_DATE = 'BITACORA_001',
  BITACORA_EMPTY_ENTRY = 'BITACORA_002',
  BITACORA_EDIT_EXPIRED = 'BITACORA_003',
  
  // Familia
  FAMILY_NOT_ADMIN = 'FAMILY_001',
  FAMILY_LAST_ADMIN = 'FAMILY_002',
  FAMILY_INVALID_EMAIL = 'FAMILY_003',
  FAMILY_MEMBER_EXISTS = 'FAMILY_004',
  
  // Pánico
  PANIC_NO_RECIPIENTS = 'PANIC_001',
  PANIC_EMAIL_FAILED = 'PANIC_002',
  
  // Auth
  AUTH_INVALID_TOKEN = 'AUTH_001',
  AUTH_EXPIRED_TOKEN = 'AUTH_002',
  
  // Permisos
  PERMISSION_DENIED = 'PERM_001',
  PERMISSION_INVALID_ROLE = 'PERM_002',
}
```

### Mensajes de Error

Todos los mensajes de error deben estar en español chileno:

```typescript
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.BITACORA_FUTURE_DATE]: 'No se puede crear una entrada para una fecha futura',
  [ErrorCode.BITACORA_EMPTY_ENTRY]: 'Debe completar al menos un campo de la bitácora',
  [ErrorCode.BITACORA_EDIT_EXPIRED]: 'Solo puede editar entradas creadas en las últimas 24 horas',
  [ErrorCode.FAMILY_NOT_ADMIN]: 'Solo los administradores pueden realizar esta acción',
  [ErrorCode.FAMILY_LAST_ADMIN]: 'No se puede remover al último administrador de la familia',
  [ErrorCode.FAMILY_INVALID_EMAIL]: 'El email ingresado no es válido',
  [ErrorCode.FAMILY_MEMBER_EXISTS]: 'Este usuario ya es miembro de la familia',
  [ErrorCode.PANIC_NO_RECIPIENTS]: 'No hay contactos para enviar la alerta de emergencia',
  [ErrorCode.PANIC_EMAIL_FAILED]: 'Error al enviar notificaciones de emergencia',
  [ErrorCode.AUTH_INVALID_TOKEN]: 'Token de invitación inválido',
  [ErrorCode.AUTH_EXPIRED_TOKEN]: 'Token de invitación expirado',
  [ErrorCode.PERMISSION_DENIED]: 'No tiene permisos para realizar esta acción',
  [ErrorCode.PERMISSION_INVALID_ROLE]: 'Rol de usuario inválido',
};
```

## Estrategia de Testing

### Enfoque Dual

El sistema implementa dos tipos de pruebas complementarias:

1. **Pruebas unitarias**: Casos específicos, casos borde, condiciones de error
2. **Pruebas basadas en propiedades**: Propiedades universales sobre todos los inputs

### Configuración de Property-Based Testing

- **Biblioteca**: fast-check (ya instalada en el proyecto)
- **Iteraciones mínimas**: 100 por propiedad
- **Etiquetado**: Cada prueba debe referenciar su propiedad de diseño

Formato de etiqueta:
```typescript
// Feature: chile-identity-and-core-services, Property 1: <texto de propiedad>
```

### Balance de Pruebas

- **Pruebas unitarias**: Enfocadas en ejemplos específicos y casos borde
- **Pruebas de propiedades**: Validan comportamiento general con inputs aleatorios
- Evitar demasiadas pruebas unitarias; las pruebas de propiedades cubren muchos inputs
- Pruebas unitarias para: ejemplos concretos, integración entre componentes, casos borde


## Propiedades de Correctitud

Una propiedad es una característica o comportamiento que debe mantenerse verdadero a través de todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de correctitud verificables por máquina.

### Propiedad 1: Round-trip de bitácora

*Para cualquier* entrada de bitácora válida con datos de comidas, ánimo y actividades, guardarla en Supabase y luego recuperarla debe producir una entrada equivalente con todos los campos preservados.

**Valida: Requisitos 3.1, 3.2, 3.3, 3.4, 3.5, 4.3**

### Propiedad 2: Formato de fecha chileno

*Para cualquier* fecha generada, cuando se formatea para mostrar al usuario, debe usar el formato DD/MM/YYYY.

**Valida: Requisitos 2.2**

### Propiedad 3: Ordenamiento cronológico de bitácora

*Para cualquier* conjunto de entradas de bitácora, cuando se muestran al usuario, deben estar ordenadas por fecha de entrada en orden descendente (más reciente primero).

**Valida: Requisitos 4.4**

### Propiedad 4: Ventana de edición de bitácora

*Para cualquier* entrada de bitácora, es editable por su creador si y solo si fue creada hace menos de 24 horas.

**Valida: Requisitos 4.5**

### Propiedad 5: Integridad de familia y membresía

*Para cualquier* familia creada, debe tener un ID único, y para cualquier miembro agregado, debe tener un rol válido (admin, cuidador, o familiar) y estar correctamente vinculado a la familia.

**Valida: Requisitos 5.1, 5.2, 5.3**

### Propiedad 6: Aislamiento de datos por familia

*Para cualquier* usuario y familia seleccionada, todas las consultas de datos (bitácora, pacientes, medicación, eventos de pánico) deben retornar solo registros asociados con esa familia específica.

**Valida: Requisitos 5.5, 7.2, 11.3, 14.3**

### Propiedad 7: Gestión de roles por administrador

*Para cualquier* miembro de familia que no sea el último administrador, un administrador debe poder cambiar su rol o removerlo del grupo.

**Valida: Requisitos 6.2, 6.3**

### Propiedad 8: Aceptación de invitación

*Para cualquier* invitación válida y no expirada, cuando un usuario la acepta, debe crearse una membresía en la familia con el rol especificado en la invitación.

**Valida: Requisitos 6.4**

### Propiedad 9: Lista completa de miembros

*Para cualquier* familia, la lista de miembros mostrada a un administrador debe incluir todos los miembros actuales con sus roles correctos.

**Valida: Requisitos 6.5**

### Propiedad 10: Persistencia de selección de familia

*Para cualquier* familia seleccionada por un usuario, después de cerrar y reabrir sesión, la misma familia debe estar seleccionada.

**Valida: Requisitos 7.3**

### Propiedad 11: Registro de evento de pánico con timestamp

*Para cualquier* activación confirmada del botón de pánico, debe crearse un evento en Supabase con timestamp, ID de paciente, ID de familia, y ID del usuario que lo activó.

**Valida: Requisitos 8.4**

### Propiedad 12: Recuperación de contactos para pánico

*Para cualquier* evento de pánico registrado, el sistema debe recuperar los emails de todos los miembros de la familia asociada.

**Valida: Requisitos 9.1**

### Propiedad 13: Envío de notificaciones de pánico

*Para cualquier* evento de pánico, el sistema debe intentar enviar notificaciones por email a todos los miembros de familia recuperados.

**Valida: Requisitos 9.2**

### Propiedad 14: Contenido de notificación de pánico

*Para cualquier* email de notificación de pánico enviado, debe incluir el timestamp del evento, nombre del paciente, y nombre del usuario que activó la alerta.

**Valida: Requisitos 9.3**

### Propiedad 15: Registro de estado de notificaciones

*Para cualquier* intento de envío de notificación de pánico, el sistema debe registrar el estado (pending, sent, failed) en la tabla panic_notifications.

**Valida: Requisitos 9.4**

### Propiedad 16: Reintentos de notificación

*Para cualquier* notificación de pánico que falle, el sistema debe reintentar el envío hasta un máximo de 3 intentos totales.

**Valida: Requisitos 9.5**

### Propiedad 17: Creación de perfil al registrar

*Para cualquier* usuario que se registra con Supabase Auth, debe crearse automáticamente un registro en la tabla profiles con nombre, email, y teléfono (si se proporciona).

**Valida: Requisitos 10.2, 10.3**

### Propiedad 18: Persistencia de sesión

*Para cualquier* usuario autenticado, después de refrescar la página, la sesión debe mantenerse válida sin requerir nuevo login.

**Valida: Requisitos 10.5**

## Estrategia de Testing (continuación)

### Propiedades Específicas por Módulo

#### Bitácora Diaria

**Propiedades**:
- Property 1: Round-trip de bitácora
- Property 2: Formato de fecha chileno
- Property 3: Ordenamiento cronológico
- Property 4: Ventana de edición

**Pruebas unitarias**:
- Validación de fecha futura (debe rechazarse)
- Validación de entrada vacía (debe rechazarse)
- Edición después de 24h (debe rechazarse)
- Formulario con fecha por defecto = hoy

#### Multi-Familiar

**Propiedades**:
- Property 5: Integridad de familia y membresía
- Property 6: Aislamiento de datos por familia
- Property 7: Gestión de roles por administrador
- Property 8: Aceptación de invitación
- Property 9: Lista completa de miembros
- Property 10: Persistencia de selección de familia

**Pruebas unitarias**:
- No se puede remover último admin (debe rechazarse)
- Email inválido en invitación (debe rechazarse)
- Usuario no-admin intenta invitar (debe rechazarse)
- Selector de familia aparece con múltiples familias

#### Botón de Pánico

**Propiedades**:
- Property 11: Registro de evento con timestamp
- Property 12: Recuperación de contactos
- Property 13: Envío de notificaciones
- Property 14: Contenido de notificación
- Property 15: Registro de estado
- Property 16: Reintentos de notificación

**Pruebas unitarias**:
- Diálogo de confirmación aparece al presionar botón
- Mensaje de éxito después de envío
- Manejo de familia sin miembros (caso borde)
- Botón visible en pantallas correctas

#### Autenticación y Perfiles

**Propiedades**:
- Property 17: Creación de perfil al registrar
- Property 18: Persistencia de sesión

**Pruebas unitarias**:
- Registro con Supabase Auth
- Recuperación de contraseña disponible
- Logout limpia sesión correctamente

### Generadores para Property-Based Testing

#### Generador de BitacoraEntry

```typescript
import * as fc from 'fast-check';

const moodTypeArb = fc.constantFrom('bien', 'regular', 'bajo', 'irritable', 'otro');

const bitacoraEntryArb = fc.record({
  patientId: fc.uuid(),
  entryDate: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  breakfast: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
  lunch: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
  dinner: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
  snacks: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
  mood: fc.option(moodTypeArb),
  moodNotes: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
  activities: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 10 })),
  activityNotes: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
});
```

#### Generador de Family

```typescript
const familyRoleArb = fc.constantFrom('admin', 'cuidador', 'familiar');

const familyArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  createdBy: fc.uuid(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

const familyMemberArb = fc.record({
  id: fc.uuid(),
  familyId: fc.uuid(),
  userId: fc.uuid(),
  userEmail: fc.emailAddress(),
  userName: fc.string({ minLength: 1, maxLength: 100 }),
  role: familyRoleArb,
  joinedAt: fc.date(),
});
```

#### Generador de PanicEvent

```typescript
const panicEventArb = fc.record({
  id: fc.uuid(),
  patientId: fc.uuid(),
  familyId: fc.uuid(),
  triggeredBy: fc.uuid(),
  location: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
  notes: fc.option(fc.string({ minLength: 1, maxLength: 500 })),
  triggeredAt: fc.date(),
  createdAt: fc.date(),
});
```

### Configuración de Vitest para Property-Based Testing

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 60000, // 60 segundos para pruebas basadas en propiedades
  },
});
```

### Ejemplo de Prueba de Propiedad

```typescript
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { BitacoraManager } from '@services/BitacoraManager';
import { bitacoraEntryArb } from './generators';

describe('BitacoraManager Properties', () => {
  // Feature: chile-identity-and-core-services, Property 1: Round-trip de bitácora
  it('Property 1: guardar y recuperar bitácora preserva todos los campos', async () => {
    await fc.assert(
      fc.asyncProperty(bitacoraEntryArb, async (entry) => {
        const manager = new BitacoraManager();
        
        // Guardar entrada
        const saveResult = await manager.createEntry(entry);
        expect(saveResult.isOk()).toBe(true);
        
        const savedEntry = saveResult.unwrap();
        
        // Recuperar entrada
        const getResult = await manager.getEntriesByDate(
          entry.patientId,
          entry.entryDate
        );
        expect(getResult.isOk()).toBe(true);
        
        const retrievedEntries = getResult.unwrap();
        const retrievedEntry = retrievedEntries.find(e => e.id === savedEntry.id);
        
        // Verificar que todos los campos se preservaron
        expect(retrievedEntry).toBeDefined();
        expect(retrievedEntry?.patientId).toBe(entry.patientId);
        expect(retrievedEntry?.breakfast).toBe(entry.breakfast);
        expect(retrievedEntry?.lunch).toBe(entry.lunch);
        expect(retrievedEntry?.dinner).toBe(entry.dinner);
        expect(retrievedEntry?.snacks).toBe(entry.snacks);
        expect(retrievedEntry?.mood).toBe(entry.mood);
        expect(retrievedEntry?.activities).toEqual(entry.activities);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Cobertura de Testing

**Objetivos de cobertura**:
- Managers (BitacoraManager, FamilyManager, PanicManager): > 90%
- Services (BitacoraService, EmailService): > 85%
- Componentes (BitacoraScreen, FamilyScreen, PanicButton): > 75%
- Propiedades de correctitud: 100% (todas las 18 propiedades implementadas)

**Herramientas**:
- Vitest para ejecución de pruebas
- fast-check para property-based testing
- @testing-library/react para pruebas de componentes
- fake-indexeddb para mock de almacenamiento
- Coverage v8 para reportes de cobertura

### Integración Continua

Las pruebas deben ejecutarse en cada push y pull request:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm test
      - run: npm run test:coverage
```

## Despliegue en GitHub Pages

### Configuración de Producción

#### Variables de Entorno (GitHub Secrets)

El despliegue en producción requiere configurar los siguientes secrets en GitHub:

1. **VITE_SUPABASE_URL**: URL del proyecto Supabase
   - Formato: `https://xxxxx.supabase.co`
   - Obtener de: Supabase Dashboard → Settings → API → Project URL

2. **VITE_SUPABASE_ANON_KEY**: Clave anónima de Supabase
   - Formato: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Obtener de: Supabase Dashboard → Settings → API → Project API keys → anon public

**Configuración en GitHub**:
```
Repositorio → Settings → Secrets and variables → Actions → New repository secret
```

#### Workflow de Despliegue

El archivo `.github/workflows/deploy.yml` debe incluir:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build with Vite
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: |
          npm run build

      - name: Generate 404.html for SPA routing
        run: |
          cp dist/app.html dist/404.html

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Configuración de GitHub Pages

1. **Habilitar GitHub Pages**:
   - Repositorio → Settings → Pages
   - Source: GitHub Actions (no "Deploy from a branch")

2. **Dominio personalizado** (opcional):
   - Custom domain: `cuidoamitata.cl`
   - Enforce HTTPS: ✓

3. **Archivo CNAME**:
   ```
   # public/CNAME
   cuidoamitata.cl
   ```

#### Configuración de Vite para GitHub Pages

El archivo `vite.config.ts` ya está configurado correctamente:

```typescript
export default defineConfig({
  base: '/', // Para dominio personalizado
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'app.html'),
      },
    },
  },
});
```

#### Configuración de Basename en React Router

El archivo `src/App.tsx` calcula el basename automáticamente:

```typescript
const pathname = window.location.pathname;
const appIdx = pathname.indexOf('app.html');
const basename = appIdx >= 0 ? pathname.slice(0, appIdx) + 'app.html' : '/';

return (
  <Router basename={basename}>
    {/* rutas */}
  </Router>
);
```

### Verificación Post-Despliegue

Después de cada despliegue, verificar:

1. **Landing page carga correctamente**:
   - Visitar `https://cuidoamitata.cl`
   - Verificar contenido en español chileno
   - Verificar enlaces a app.html

2. **SPA carga correctamente**:
   - Visitar `https://cuidoamitata.cl/app.html`
   - Verificar que aparece pantalla de login

3. **Autenticación funciona**:
   - Intentar login con credenciales de prueba
   - Si falla con "Supabase no configurado", verificar que los Secrets están definidos
   - Si los Secrets se agregaron después del último despliegue, volver a desplegar

4. **Rutas SPA funcionan**:
   - Navegar a `/app.html/medications`
   - Refrescar la página (F5)
   - Debe cargar correctamente (gracias a 404.html)

5. **Datos persisten en Supabase**:
   - Crear una entrada de bitácora
   - Verificar en Supabase Dashboard → Table Editor que el registro existe
   - Cerrar sesión y volver a entrar
   - Verificar que la entrada sigue visible

### Troubleshooting

#### Problema: "Supabase no configurado"

**Causa**: Los GitHub Secrets no están definidos o el build no los recibió.

**Solución**:
1. Verificar que los Secrets existen en GitHub
2. Volver a ejecutar el workflow de despliegue
3. Verificar en los logs del workflow que las variables de entorno están presentes

#### Problema: Rutas 404 al refrescar

**Causa**: El archivo 404.html no se generó correctamente.

**Solución**:
1. Verificar que el workflow incluye el paso de generar 404.html
2. Verificar que dist/404.html existe después del build
3. Volver a desplegar

#### Problema: Estilos no cargan

**Causa**: Rutas de assets incorrectas.

**Solución**:
1. Verificar que `base: '/'` en vite.config.ts
2. Verificar que los assets están en dist/ después del build
3. Limpiar caché del navegador

#### Problema: RLS bloquea acceso a datos

**Causa**: Políticas RLS mal configuradas o usuario no tiene familia asignada.

**Solución**:
1. Verificar políticas RLS en Supabase Dashboard
2. Verificar que el usuario tiene un registro en family_members
3. Revisar logs de Supabase para ver errores de políticas

### Documentación de Referencia

- [docs/despliegue-github-pages.md](../../../docs/despliegue-github-pages.md): Guía detallada de despliegue
- [docs/lista-verificacion-produccion.md](../../../docs/lista-verificacion-produccion.md): Checklist pre-despliegue
- [docs/configuracion-supabase.md](../../../docs/configuracion-supabase.md): Configuración de Supabase

---

**Última actualización**: 2024-02-13
**Versión**: 1.0.0
