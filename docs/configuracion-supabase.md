# Configuración de Supabase para CuidoAMiTata

Guía para configurar la autenticación con Supabase en desarrollo y producción.

## ¿Por qué Supabase?

- **Seguro**: Las contraseñas no se almacenan en el código.
- **Escalable**: Soporta miles de usuarios.
- **Gratuito**: Plan gratuito suficiente para empezar.
- **Profesional**: Autenticación JWT con refresh tokens.
- **Rápido**: Configuración en pocos minutos.

## Paso 1: Crear cuenta en Supabase

1. Entra en [supabase.com](https://supabase.com).
2. Pulsa en «Start your project».
3. Crea una cuenta (puedes usar GitHub).

## Paso 2: Crear un proyecto

1. Pulsa en «New Project».
2. Rellena:
   - **Name**: CuidoAMiTata
   - **Database Password**: Genera una contraseña segura y guárdala.
   - **Region**: La más cercana (por ejemplo South America).
3. Pulsa «Create new project».
4. Espera 2–3 minutos a que se cree el proyecto.

## Paso 3: Obtener credenciales

1. En el proyecto, ve a **Settings** (⚙️) > **API**.
2. Copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Paso 4: Variables de entorno

En la raíz del proyecto crea `.env.local`:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

Sustituye por los valores copiados en el paso 3.

## Paso 5: Tabla de perfiles

1. En Supabase, ve a **SQL Editor**.
2. Crea una nueva consulta y pega:

```sql
-- Tabla de perfiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cuidador', 'familiar')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cuidador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. Ejecuta el script (Run).

## Paso 6: Usuarios de prueba

1. Ve a **Authentication** > **Users**.
2. **Add user** > **Create new user**.
3. Email: `admin@cuidoamitata.cl`, contraseña (ej. `admin123`).
4. Activa **Auto Confirm User** y crea el usuario.

## Paso 7: Probar en local

1. Reinicia el servidor: `npm run dev`.
2. Abre `http://localhost:5173/app.html`.
3. Inicia sesión con el usuario creado.

## Paso 8: Producción (GitHub Pages u otro hosting)

En los **Secrets** o variables de entorno de tu hosting añade:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

En GitHub: **Settings** > **Secrets and variables** > **Actions**.

## Sin Supabase

Si no configuras Supabase, la aplicación sigue cargando; el login fallará hasta que añadas las variables. No hay modo demo con credenciales en código; para producción se debe usar Supabase u otro servicio de autenticación.

## Gestión de usuarios

- **Crear**: Authentication > Users > Add user, o registro desde la app con `signUp`.
- **Editar rol**: Table Editor > **profiles** > editar campo `role`.
- **Eliminar**: Authentication > Users > eliminar usuario (el perfil se borra en cascada).

## Seguridad

- El **anon key** es público por diseño; la seguridad se basa en RLS, JWT y HTTPS.
- No subas `.env.local` (está en `.gitignore`).
- Usa contraseñas fuertes y, si puedes, 2FA en la cuenta de Supabase.

## Enlaces

- [Documentación Supabase](https://supabase.com/docs)
- [Discord Supabase](https://discord.supabase.com)

[Volver al índice](README.md)
