# Guía de Despliegue - CuidoAMiTata

## Preparación para Despliegue

### 1. Verificación Pre-Despliegue

Antes de desplegar, asegúrese de que:

```bash
# Verificar tipos TypeScript
npm run type-check

# Ejecutar todas las pruebas
npm test

# Verificar cobertura de código
npm run test:coverage

# Verificar linting
npm run lint

# Verificar formato
npm run format:check
```

Todos los comandos deben completarse sin errores.

### 2. Variables de Entorno

#### Desarrollo

Copie `.env.development` (ya configurado):
```bash
# No requiere acción, ya está configurado
```

#### Producción

Cree `.env.production` basado en `.env.example`:

```bash
cp .env.example .env.production
```

Edite `.env.production` con valores reales:

```env
# API Configuration
VITE_API_URL=https://api.cuidoamitata.cl
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=true
VITE_ENABLE_OFFLINE_MODE=true

# Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX  # Obtener de Google Analytics
VITE_GTM_ID=GTM-XXXXXXX           # Obtener de Google Tag Manager

# Error Tracking
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx  # Obtener de Sentry
VITE_SENTRY_ENVIRONMENT=production

# Storage
VITE_STORAGE_ENCRYPTION_KEY=<generar-clave-segura-256-bits>
VITE_MAX_STORAGE_MB=100

# Notifications
VITE_VAPID_PUBLIC_KEY=<generar-vapid-key>
VITE_NOTIFICATION_SOUND_URL=/sounds/notification.mp3

# Sync
VITE_SYNC_INTERVAL_MS=300000
VITE_MAX_RETRY_ATTEMPTS=3

# Security
VITE_AUTO_LOGOUT_MINUTES=15
VITE_TOKEN_REFRESH_THRESHOLD_MINUTES=5
VITE_MAX_LOGIN_ATTEMPTS=3

# App Info
VITE_APP_NAME=CuidoAMiTata
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

**Generar Clave de Cifrado**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generar VAPID Keys** (para notificaciones push):
```bash
npx web-push generate-vapid-keys
```

### 3. Build de Producción

```bash
# Compilar TypeScript y crear build optimizado
npm run build

# Compilar CSS de Tailwind
npm run build:css
```

Esto genera:
- `dist/` - Archivos de la aplicación
- `css/output.css` - CSS compilado y minificado

### 4. Preview Local

Antes de desplegar, pruebe el build localmente:

```bash
npm run preview
```

Abra http://localhost:4173 y verifique:
- ✅ La aplicación carga correctamente
- ✅ Todas las rutas funcionan
- ✅ El tema oscuro/claro funciona
- ✅ Las notificaciones funcionan
- ✅ El modo offline funciona

---

## Opciones de Despliegue

### Opción 1: Vercel (Recomendado)

Vercel es ideal para aplicaciones React con Vite.

#### Configuración

1. **Instalar Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login**:
```bash
vercel login
```

3. **Configurar Proyecto**:

Cree `vercel.json`:
```json
{
  "buildCommand": "npm run build && npm run build:css",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

4. **Configurar Variables de Entorno**:
```bash
vercel env add VITE_API_URL production
vercel env add VITE_SENTRY_DSN production
# ... agregar todas las variables
```

5. **Desplegar**:
```bash
# Despliegue de prueba
vercel

# Despliegue a producción
vercel --prod
```

#### Dominio Personalizado

```bash
vercel domains add cuidoamitata.cl
```

---

### Opción 2: Netlify

#### Configuración

1. **Instalar Netlify CLI**:
```bash
npm install -g netlify-cli
```

2. **Login**:
```bash
netlify login
```

3. **Configurar Proyecto**:

Cree `netlify.toml`:
```toml
[build]
  command = "npm run build && npm run build:css"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

4. **Desplegar**:
```bash
# Inicializar
netlify init

# Desplegar
netlify deploy --prod
```

---

### Opción 3: GitHub Pages

#### Configuración

1. **Actualizar `vite.config.ts`**:
```typescript
export default defineConfig({
  base: '/CuidoAMiTata.cl/', // Nombre del repositorio
  // ... resto de la configuración
});
```

2. **Crear Workflow de GitHub Actions**:

Cree `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build && npm run build:css
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

3. **Configurar GitHub Pages**:
   - Vaya a Settings → Pages
   - Source: GitHub Actions
   - Guarde

4. **Agregar Secrets**:
   - Settings → Secrets → Actions
   - Agregue todas las variables de entorno

---

### Opción 4: Firebase Hosting

#### Configuración

1. **Instalar Firebase CLI**:
```bash
npm install -g firebase-tools
```

2. **Login**:
```bash
firebase login
```

3. **Inicializar**:
```bash
firebase init hosting
```

Seleccione:
- Public directory: `dist`
- Single-page app: `Yes`
- GitHub integration: `Yes` (opcional)

4. **Configurar `firebase.json`**:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css|woff|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

5. **Desplegar**:
```bash
npm run build && npm run build:css
firebase deploy
```

---

## CI/CD Completo

### GitHub Actions (Recomendado)

Cree `.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Format check
        run: npm run format:check
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build && npm run build:css
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
          VITE_GA_TRACKING_ID: ${{ secrets.VITE_GA_TRACKING_ID }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.cuidoamitata.cl
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Staging
        run: |
          # Comando de despliegue según plataforma
          # Ejemplo para Vercel:
          npx vercel --token=${{ secrets.VERCEL_TOKEN }} --prod

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://cuidoamitata.cl
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Production
        run: |
          # Comando de despliegue según plataforma
          npx vercel --token=${{ secrets.VERCEL_TOKEN }} --prod
```

---

## Post-Despliegue

### 1. Verificación

Después del despliegue, verifique:

- ✅ La aplicación carga en https://cuidoamitata.cl
- ✅ Todas las rutas funcionan correctamente
- ✅ El tema oscuro/claro funciona
- ✅ Las notificaciones funcionan
- ✅ El modo offline funciona
- ✅ Los formularios se envían correctamente
- ✅ Las imágenes cargan correctamente
- ✅ No hay errores en la consola

### 2. Configurar Monitoreo

#### Sentry (Errores)

1. Cree cuenta en https://sentry.io
2. Cree nuevo proyecto React
3. Copie el DSN
4. Agregue a variables de entorno

#### Google Analytics (Uso)

1. Cree cuenta en https://analytics.google.com
2. Cree nueva propiedad
3. Copie el Tracking ID
4. Agregue a variables de entorno

#### Uptime Monitoring

Configure en:
- Pingdom: https://www.pingdom.com
- UptimeRobot: https://uptimerobot.com
- StatusCake: https://www.statuscake.com

### 3. Configurar SEO

#### Google Search Console

1. Vaya a https://search.google.com/search-console
2. Agregue propiedad: https://cuidoamitata.cl
3. Verifique propiedad
4. Envíe sitemap: https://cuidoamitata.cl/sitemap.xml

#### Validar Structured Data

1. Vaya a https://search.google.com/test/rich-results
2. Ingrese URL: https://cuidoamitata.cl
3. Verifique que no haya errores

### 4. Configurar CDN (Opcional)

Para mejor rendimiento global:

#### Cloudflare

1. Cree cuenta en https://cloudflare.com
2. Agregue sitio: cuidoamitata.cl
3. Actualice nameservers en su registrador de dominio
4. Configure:
   - SSL/TLS: Full (strict)
   - Always Use HTTPS: On
   - Auto Minify: JS, CSS, HTML
   - Brotli: On
   - HTTP/2: On
   - HTTP/3: On

---

## Rollback

Si algo sale mal:

### Vercel
```bash
vercel rollback
```

### Netlify
```bash
netlify rollback
```

### GitHub Pages
```bash
git revert HEAD
git push origin main
```

---

## Checklist de Despliegue

Antes de cada despliegue:

- [ ] Todas las pruebas pasan
- [ ] Cobertura de código > 80%
- [ ] Type check sin errores
- [ ] Lint sin errores
- [ ] Variables de entorno configuradas
- [ ] Build de producción exitoso
- [ ] Preview local verificado
- [ ] Changelog actualizado
- [ ] Versión incrementada en package.json
- [ ] Tag de Git creado
- [ ] Documentación actualizada

Después del despliegue:

- [ ] Aplicación accesible
- [ ] Todas las funcionalidades probadas
- [ ] Monitoreo configurado
- [ ] SEO configurado
- [ ] Equipo notificado
- [ ] Usuarios notificados (si aplica)

---

## Soporte

Para problemas de despliegue:

- **Email**: cuidoamitata@gmail.com
- **Documentación**: https://cuidoamitata.cl/docs
- **GitHub Issues**: https://github.com/Iyov/CuidoAMiTata.cl/issues

---

**Última actualización**: 2026-02-13
**Versión**: 1.0.0
