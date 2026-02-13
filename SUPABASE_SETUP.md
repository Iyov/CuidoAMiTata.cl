# Configuración de Supabase para CuidoAMiTata

Este documento explica cómo configurar Supabase para autenticación real en producción.

## ¿Por qué Supabase?

- ✅ **Seguro**: Las contraseñas nunca se almacenan en el código
- ✅ **Escalable**: Soporta miles de usuarios
- ✅ **Gratis**: Plan gratuito generoso para empezar
- ✅ **Profesional**: Autenticación JWT real con refresh tokens
- ✅ **Fácil**: Configuración en minutos

## Paso 1: Crear cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Crea una cuenta (puedes usar GitHub)

## Paso 2: Crear un nuevo proyecto

1. Haz clic en "New Project"
2. Completa:
   - **Name**: CuidoAMiTata
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Elige la más cercana a tus usuarios (ej: South America)
3. Haz clic en "Create new project"
4. Espera 2-3 minutos mientras se crea el proyecto

## Paso 3: Obtener las credenciales

1. En el dashboard de tu proyecto, ve a **Settings** (⚙️) > **API**
2. Copia estos valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Paso 4: Configurar variables de entorno

1. En la raíz del proyecto, crea un archivo `.env.local`:

```bash
# Configuración de Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

2. Reemplaza los valores con los que copiaste en el paso 3

## Paso 5: Crear la tabla de perfiles

1. En Supabase, ve a **SQL Editor**
2. Crea una nueva query y pega este código:

```sql
-- Crear tabla de perfiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cuidador', 'familiar')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Función para crear perfil automáticamente al registrarse
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

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. Haz clic en "Run" para ejecutar el script

## Paso 6: Crear usuarios de prueba

1. En Supabase, ve a **Authentication** > **Users**
2. Haz clic en "Add user" > "Create new user"
3. Completa:
   - **Email**: admin@cuidoamitata.cl
   - **Password**: admin123 (o la que prefieras)
   - **Auto Confirm User**: ✅ Activado
4. Repite para crear más usuarios

## Paso 7: Probar la aplicación

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre `http://localhost:5173/app.html`

3. Deberías ver en la consola:
   ```
   ✅ Usando autenticación con Supabase (producción)
   ```

4. Intenta iniciar sesión con las credenciales que creaste

## Paso 8: Desplegar a producción

1. En tu plataforma de hosting (Vercel, Netlify, etc.), agrega las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Despliega la aplicación

3. ¡Listo! Tu aplicación ahora usa autenticación real y segura

## Modo Demo (sin Supabase)

Si NO configuras Supabase, la aplicación usará el modo demo con `src/config/users.ts`:

```
⚠️ Usando autenticación demo (users.ts) - NO USAR EN PRODUCCIÓN
```

**IMPORTANTE**: El modo demo NO es seguro para producción porque:
- Las contraseñas están en el código fuente
- Cualquiera con acceso al código puede ver las credenciales
- No hay encriptación real
- No es escalable

## Gestión de usuarios en Supabase

### Crear un nuevo usuario

**Opción 1: Desde el dashboard**
1. Ve a **Authentication** > **Users**
2. Haz clic en "Add user"
3. Completa email y contraseña
4. El perfil se crea automáticamente

**Opción 2: Permitir registro público**
1. En tu aplicación, implementa un formulario de registro
2. Usa `supabase.auth.signUp()` para crear usuarios
3. El trigger creará el perfil automáticamente

### Modificar un usuario

1. Ve a **Authentication** > **Users**
2. Haz clic en el usuario
3. Puedes cambiar email, contraseña, etc.

Para cambiar el rol:
1. Ve a **Table Editor** > **profiles**
2. Busca el usuario por email
3. Edita el campo `role`

### Eliminar un usuario

1. Ve a **Authentication** > **Users**
2. Haz clic en el usuario
3. Haz clic en "Delete user"
4. El perfil se eliminará automáticamente (CASCADE)

## Seguridad

### ¿Es seguro el anon key en el código?

Sí, el `anon key` está diseñado para ser público. La seguridad viene de:

1. **Row Level Security (RLS)**: Las políticas SQL controlan quién puede ver qué
2. **JWT**: Los tokens son firmados y verificados por Supabase
3. **HTTPS**: Toda la comunicación está encriptada

### Mejores prácticas

1. ✅ Nunca subas `.env.local` a GitHub (ya está en .gitignore)
2. ✅ Usa contraseñas fuertes para usuarios
3. ✅ Habilita 2FA en tu cuenta de Supabase
4. ✅ Revisa los logs de autenticación regularmente
5. ✅ Configura políticas RLS estrictas

## Soporte

- **Documentación oficial**: https://supabase.com/docs
- **Discord de Supabase**: https://discord.supabase.com
- **Ejemplos**: https://github.com/supabase/supabase/tree/master/examples

## Resumen

✅ **Con Supabase**: Autenticación segura, escalable y profesional
❌ **Sin Supabase**: Modo demo inseguro, solo para desarrollo

Para producción, SIEMPRE usa Supabase u otro servicio de autenticación real.
