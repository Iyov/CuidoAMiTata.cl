# Despliegue en GitHub Pages

Guía completa para desplegar CuidoAMiTata.cl en GitHub Pages con dominio personalizado.

## 📋 Requisitos Previos

- Repositorio en GitHub
- Proyecto de Supabase configurado
- Dominio personalizado (opcional): cuidoamitata.cl

## 🚀 Configuración Inicial

### 1. Configurar GitHub Secrets

Las credenciales de Supabase deben estar en GitHub Secrets para el build de producción.

1. Ve a tu repositorio en GitHub
2. Navega a **Settings > Secrets and variables > Actions**
3. Haz clic en **New repository secret**
4. Agrega los siguientes secrets:

   - **VITE_SUPABASE_URL**: Tu URL de Supabase
   - **VITE_SUPABASE_ANON_KEY**: Tu clave anónima de Supabase

### 2. Configurar GitHub Pages

1. Ve a **Settings > Pages**
2. En "Build and deployment":
   - **Source**: GitHub Actions
3. Guarda los cambios

### 3. Configurar Dominio Personalizado (Opcional)

Si tienes un dominio personalizado:

1. En **Settings > Pages > Custom domain**:
   - Ingresa: `cuidoamitata.cl`
   - Haz clic en "Save"
2. Activa **Enforce HTTPS** (espera unos minutos si no está disponible)

### 4. Configurar DNS

En tu proveedor de dominio, agrega estos registros DNS:

```
Tipo    Nombre    Valor
A       @         185.199.108.153
A       @         185.199.109.153
A       @         185.199.110.153
A       @         185.199.111.153
CNAME   www       tu-usuario.github.io
```

Espera 10-30 minutos para que los DNS se propaguen.

## 📁 Estructura del Proyecto

### Archivos de Configuración

```
.github/workflows/deploy.yml    # Workflow de GitHub Actions
public/
├── .nojekyll                   # Desactiva Jekyll
├── CNAME                       # Dominio personalizado
├── robots.txt                  # SEO
└── sitemap.xml                 # SEO
vite.config.ts                  # Configuración de Vite
verify-build.js                 # Script de verificación
```

### Configuración de Vite

El archivo `vite.config.ts` está configurado con:

```typescript
base: '/',              // Para dominio personalizado
publicDir: 'public',    // Directorio de archivos estáticos
copyPublicDir: true,    // Copia archivos a dist/
```

## 🔄 Proceso de Despliegue

### Despliegue Automático

El sitio se despliega automáticamente cuando haces push a la rama `main`:

```bash
git add .
git commit -m "Tu mensaje de commit"
git push origin main
```

El workflow de GitHub Actions:
1. Instala dependencias
2. Compila Tailwind CSS
3. Ejecuta tests (opcional, no bloquea deployment)
4. Compila el proyecto con Vite
5. Verifica archivos críticos (CNAME, .nojekyll)
6. Despliega a GitHub Pages

### Despliegue Manual

También puedes ejecutar el workflow manualmente:

1. Ve a **Actions** en GitHub
2. Selecciona "Deploy to GitHub Pages"
3. Haz clic en **Run workflow**

## � Verificación

### Verificar Configuración Local

Antes de hacer push, verifica que todo esté correcto:

```bash
# Verificar configuración
npm run verify

# Build local
npm run build

# Preview local
npm run preview
```

### Verificar Deployment

Después del despliegue:

1. Ve a **Actions** en GitHub
2. Verifica que el workflow se completó exitosamente (✅)
3. Visita tu sitio:
   - Con dominio personalizado: https://cuidoamitata.cl
   - Sin dominio: https://tu-usuario.github.io/tu-repo

## 🐛 Solución de Problemas

### Build Falla

**Síntoma**: El workflow falla en el paso "Build Vite"

**Solución**:
```bash
# Ejecutar build localmente para ver errores
npm run build

# Verificar errores de TypeScript
npm run type-check
```

### Dominio Personalizado No Funciona

**Síntoma**: El sitio no carga en tu dominio

**Solución**:
1. Verifica los registros DNS en tu proveedor
2. Espera 10-30 minutos para propagación
3. Verifica con: `nslookup cuidoamitata.cl`
4. Asegúrate que `public/CNAME` contenga solo tu dominio

### Assets No Cargan (404)

**Síntoma**: CSS, JS o imágenes no cargan

**Solución**:
- Para dominio personalizado: `base: '/'` en `vite.config.ts`
- Para GitHub Pages sin dominio: `base: '/nombre-repo/'`

### Tests Fallan

**Síntoma**: El workflow muestra tests fallando

**Nota**: Los tests son opcionales y no bloquean el deployment. El sitio se desplegará correctamente incluso si algunos tests fallan.

## 📊 Monitoreo

### Ver Logs del Deployment

1. Ve a **Actions** en GitHub
2. Haz clic en el workflow más reciente
3. Revisa los logs de cada paso

### Verificar Archivos Desplegados

El directorio `dist/` contiene:
```
dist/
├── index.html          # Landing page
├── app.html           # Aplicación React
├── assets/            # JS, CSS, fonts, images
├── CNAME              # Configuración de dominio
├── .nojekyll          # Para GitHub Pages
├── robots.txt         # SEO
└── sitemap.xml        # SEO
```

## 🔒 Seguridad

- ✅ Credenciales en GitHub Secrets (no en el código)
- ✅ `.env.local` en `.gitignore`
- ✅ HTTPS habilitado automáticamente
- ✅ `console.log` eliminados en producción

## � Comandos Útiles

```bash
# Verificar configuración
npm run verify

# Build de producción
npm run build

# Preview local del build
npm run preview

# Ejecutar tests
npm test

# Compilar Tailwind CSS
npm run build:css

# Verificar tipos de TypeScript
npm run type-check
```

## 🔄 Actualizar el Sitio

Para actualizar el sitio desplegado:

```bash
# 1. Hacer cambios en el código
# 2. Commit y push
git add .
git commit -m "Descripción de cambios"
git push origin main

# 3. El sitio se actualizará automáticamente en 2-3 minutos
```

## ✅ Checklist de Deployment

Antes de desplegar por primera vez:

- [ ] GitHub Secrets configurados (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] GitHub Pages configurado (Source: GitHub Actions)
- [ ] Dominio personalizado configurado (si aplica)
- [ ] DNS configurado (si aplica)
- [ ] `npm run verify` pasa sin errores
- [ ] `npm run build` completa exitosamente
- [ ] Archivos en `public/` verificados (CNAME, .nojekyll, robots.txt, sitemap.xml)

## � Recursos Adicionales

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Documentation](https://supabase.com/docs)

---

**Última actualización**: 2026-02-13  
**Estado**: ✅ Configurado y funcionando
