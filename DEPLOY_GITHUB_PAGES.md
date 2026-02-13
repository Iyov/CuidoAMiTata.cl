# Despliegue en GitHub Pages - CuidoAMiTata

Esta guía te ayudará a desplegar tu aplicación en GitHub Pages con dominio personalizado `cuidoamitata.cl`.

## 📋 Requisitos previos

- ✅ Repositorio en GitHub
- ✅ Proyecto de Supabase configurado
- ✅ Dominio `cuidoamitata.cl` (opcional, pero recomendado)

## 🚀 Paso 1: Configurar GitHub Secrets

Las credenciales de Supabase deben estar en GitHub Secrets para que el build funcione.

1. **Ve a tu repositorio en GitHub:**
   - `https://github.com/TU_USUARIO/CuidoAMiTata.cl`

2. **Ve a Settings > Secrets and variables > Actions**

3. **Haz clic en "New repository secret"**

4. **Agrega estos dos secrets:**

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://tu-proyecto.supabase.co` (tu URL de Supabase)

   **Secret 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tu anon key completa)

## 🔧 Paso 2: Configurar GitHub Pages

1. **Ve a Settings > Pages**

2. **En "Build and deployment":**
   - Source: `GitHub Actions`

3. **Guarda los cambios**

## 📝 Paso 3: Verificar vite.config.ts

El archivo ya está configurado correctamente con:

```typescript
base: '/',  // Para dominio custom (cuidoamitata.cl)
publicDir: 'public',  // Copia archivos estáticos
copyPublicDir: true,  // Asegura que se copien todos los archivos
```

## 🌐 Paso 4: Configurar dominio personalizado

### En tu proveedor de dominio (ej: GoDaddy, Namecheap):

1. **Agrega estos registros DNS:**

   **Para apex domain (cuidoamitata.cl):**
   ```
   Tipo: A
   Host: @
   Valor: 185.199.108.153
   
   Tipo: A
   Host: @
   Valor: 185.199.109.153
   
   Tipo: A
   Host: @
   Valor: 185.199.110.153
   
   Tipo: A
   Host: @
   Valor: 185.199.111.153
   ```

   **Para www (www.cuidoamitata.cl):**
   ```
   Tipo: CNAME
   Host: www
   Valor: iyov.github.io
   ```

2. **Espera 5-10 minutos** para que los DNS se propaguen

### En GitHub:

1. **Ve a Settings > Pages**

2. **En "Custom domain":**
   - Escribe: `cuidoamitata.cl`
   - Haz clic en "Save"

3. **Activa "Enforce HTTPS"** (espera unos minutos si no está disponible)

## 📁 Archivos de configuración importantes

### public/CNAME
```
cuidoamitata.cl
```

### public/.nojekyll
Archivo vacío que desactiva Jekyll en GitHub Pages (ya creado).

### public/robots.txt y public/sitemap.xml
Ya están copiados al directorio public/ para SEO.

## 🚀 Paso 5: Desplegar

### Opción A: Push automático

Simplemente haz push a la rama `main`:

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

El workflow se ejecutará automáticamente.

### Opción B: Despliegue manual

1. Ve a tu repositorio en GitHub
2. Haz clic en "Actions"
3. Selecciona "Deploy to GitHub Pages"
4. Haz clic en "Run workflow"

## 📊 Paso 6: Verificar el despliegue

1. **Ve a Actions en GitHub:**
   - Verás el workflow ejecutándose
   - Espera a que termine (2-3 minutos)

2. **Verifica que todo esté verde ✅**

3. **Abre tu sitio:**
   - `https://cuidoamitata.cl`

## 🔍 Verificar que funciona

1. **Landing page:**
   - `https://cuidoamitata.cl` → Debería mostrar la landing page

2. **Aplicación React:**
   - `https://cuidoamitata.cl/app.html` → Debería mostrar el login

3. **Iniciar sesión:**
   - Usa tus credenciales de Supabase
   - Deberías poder entrar al dashboard

## 🐛 Troubleshooting

### Error: "Failed to load resource: 404"

**Causa:** El base path está mal configurado.

**Solución:**
- Ya está configurado correctamente con `base: '/'` para dominio custom

### Error: "Invalid API key"

**Causa:** Los secrets de GitHub no están configurados.

**Solución:**
1. Ve a Settings > Secrets and variables > Actions
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` existan
3. Verifica que los valores sean correctos

### Error: "Page not found"

**Causa:** GitHub Pages no está configurado correctamente.

**Solución:**
1. Ve a Settings > Pages
2. Source debe ser "GitHub Actions"
3. Re-ejecuta el workflow

### El dominio custom no funciona

**Causa:** DNS no está configurado o no se ha propagado.

**Solución:**
1. Verifica los registros DNS en tu proveedor
2. Espera 10-30 minutos para propagación
3. Verifica con: `nslookup cuidoamitata.cl`

### CNAME no se encuentra en dist/

**Causa:** El archivo no se copió durante el build.

**Solución:**
- El workflow ahora incluye verificación automática
- Si falta, se copia automáticamente desde la raíz

### Los estilos no se cargan

**Causa:** Tailwind CSS no se compiló.

**Solución:**
- El workflow ya incluye `npm run build:css`
- Verifica que el workflow se ejecutó correctamente

## 📁 Estructura de archivos desplegados

```
dist/
├── index.html          # Landing page
├── app.html           # Aplicación React
├── assets/            # JS y CSS compilados
├── img/               # Imágenes
├── css/               # Estilos
├── CNAME              # Configuración de dominio
├── .nojekyll          # Para GitHub Pages
├── robots.txt         # SEO
└── sitemap.xml        # SEO
```

## 🔄 Actualizar el sitio

Cada vez que hagas push a `main`, el sitio se actualizará automáticamente:

```bash
# Hacer cambios en el código
git add .
git commit -m "Actualización de la app"
git push origin main

# Espera 2-3 minutos y el sitio estará actualizado
```

## 🔧 Mejoras implementadas

✅ **Verificación automática de archivos críticos**
- El workflow verifica que CNAME y .nojekyll existan en dist/
- Si faltan, los copia automáticamente

✅ **Archivos estáticos en public/**
- CNAME, .nojekyll, robots.txt y sitemap.xml están en public/
- Vite los copia automáticamente a dist/ durante el build

✅ **Configuración optimizada de Vite**
- `publicDir: 'public'` configurado
- `copyPublicDir: true` habilitado

## 🔒 Seguridad

- ✅ Las credenciales de Supabase están en GitHub Secrets (no en el código)
- ✅ El `.env.local` está en `.gitignore` (no se sube a GitHub)
- ✅ HTTPS está habilitado automáticamente
- ✅ Los console.log se eliminan en producción

## 📚 Recursos adicionales

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Docs](https://supabase.com/docs)

## ✅ Checklist final

Antes de desplegar, verifica:

- [x] GitHub Secrets configurados (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`)
- [x] GitHub Pages configurado (Source: GitHub Actions)
- [x] `base: '/'` en `vite.config.ts` para dominio custom
- [ ] Dominio custom configurado en GitHub Pages
- [x] `.nojekyll` existe en `public/`
- [x] `CNAME` existe en `public/`
- [x] Workflow `.github/workflows/deploy.yml` actualizado
- [x] `robots.txt` y `sitemap.xml` en `public/`
- [ ] Push a rama `main` hecho

¡Listo! Tu aplicación debería estar en línea en `https://cuidoamitata.cl` 🎉
