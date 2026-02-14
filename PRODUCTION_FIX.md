# Corrección de Errores de Producción

## Problemas Identificados y Solucionados

### 1. Error: `Export 'AuthScreen' is not defined in module`
**Causa**: `AuthScreen` estaba siendo importado directamente en `App.tsx` pero también se intentaba cargar de forma lazy a través del barrel export `./screens/index.ts`, causando un conflicto en el bundling de Vite.

**Solución**: Se reorganizó la importación de `AuthScreen` para que sea directa (no lazy) ya que se necesita inmediatamente al cargar la app.

### 1.1. Error: `Export 'Alert' is not defined in module`
**Causa**: Vite estaba teniendo problemas con el code splitting de los componentes compartidos, causando que las exportaciones del barrel file `src/components/index.ts` no se resolvieran correctamente en producción.

**Solución**: Se agregó un chunk manual para `components` en `vite.config.ts` que agrupa todos los componentes compartidos (Alert, Button, Card, Input, Toast, etc.) en un bundle separado, asegurando que las exportaciones se resuelvan correctamente.

### 1.2. Error: `Export 'AuthScreen' is not defined in module`
**Causa**: `AuthScreen` estaba siendo importado directamente en `App.tsx` pero también exportado en el barrel file `src/screens/index.ts`. Esto causaba un conflicto en el code splitting de Vite porque el mismo módulo se estaba incluyendo en dos chunks diferentes (el chunk principal de la app y el chunk manual de `auth`), resultando en exportaciones duplicadas y conflictivas.

**Solución**: 
1. Se agregó un chunk manual para `auth` en `vite.config.ts` que contiene `AuthScreen` en un bundle separado
2. Se removió `AuthScreen` del barrel export `src/screens/index.ts` para evitar que se incluya en múltiples chunks
3. Ahora `AuthScreen` solo se importa directamente desde `./screens/AuthScreen.tsx` y se empaqueta en su propio chunk `auth`

### 2. Error: `img/CuidoAMiTata_Logo_500.png: 404` y `js/index.js: 404`
**Causa**: Los recursos estáticos (css/, js/, img/, webfonts/) estaban solo en `public/` pero no en la raíz, causando problemas en desarrollo local.

**Solución**: 
- Se mantienen los recursos editables en la RAÍZ del proyecto (css/, js/, img/, webfonts/)
- Se creó script `sync:landing` que copia automáticamente de raíz → `public/`:
  - `index.html` → `public/index.html`
  - `manifest.json` → `public/manifest.json`
  - `css/` → `public/css/`
  - `js/` → `public/js/`
  - `img/` → `public/img/`
  - `webfonts/` → `public/webfonts/`
- Se actualizó `vite.config.ts` para que solo procese `app.html` (React app)
- Se actualizaron todas las referencias para usar rutas relativas (sin `/` inicial)

### 3. Error: `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT`
**Causa**: Este error es causado por bloqueadores de anuncios (ad-blockers) en el navegador del usuario. No es un error de la aplicación.

**Solución**: No requiere acción. Es un comportamiento normal cuando los usuarios tienen extensiones de bloqueo de anuncios.

## Estructura Final

```
proyecto/
├── RAÍZ (archivos editables para desarrollo)
│   ├── index.html            # Landing page
│   ├── manifest.json         # Configuración PWA
│   ├── css/                  # Estilos editables
│   ├── js/                   # Scripts editables
│   ├── img/                  # Imágenes editables
│   └── webfonts/             # Fuentes editables
│
├── public/                   # Sincronización automática (NO editar)
│   ├── index.html            # Copiado desde raíz
│   ├── manifest.json         # Copiado desde raíz
│   ├── css/                  # Copiado desde raíz
│   ├── js/                   # Copiado desde raíz
│   ├── img/                  # Copiado desde raíz
│   ├── webfonts/             # Copiado desde raíz
│   ├── .nojekyll
│   ├── CNAME
│   ├── robots.txt
│   └── sitemap.xml
│
├── app.html                  # React app (procesada por Vite)
├── src/                      # Código fuente React
│
└── dist/                     # Build de producción
    ├── index.html            # Landing (copiada desde public/)
    ├── app.html              # React app (procesada)
    ├── css/, js/, img/       # Recursos (copiados desde public/)
    └── assets/               # Bundles de Vite
```

## Archivos Modificados

1. `src/App.tsx` - Reorganizada importación de AuthScreen (importación directa, no lazy)
2. `app.html` - Actualizada ruta del logo a `img/`
3. `manifest.json` - Actualizada ruta del logo a `img/`
4. `src/screens/AuthScreen.tsx` - Actualizada ruta del logo a `img/`
5. `src/screens/index.ts` - Removido AuthScreen del barrel export para evitar conflictos de code splitting
6. `index.html` - Actualizada ruta del logo a `img/` (Open Graph, Twitter Cards, favicon, img)
7. `vite.config.ts` - Removido `index.html` del input (solo procesa `app.html`), agregado chunk manual para `components` y `auth` para resolver problemas de code splitting
8. `package.json` - Agregado script `sync:landing` mejorado que copia TODOS los recursos editables (index.html, manifest.json, css/, js/, img/, webfonts/) de raíz a public/
9. `.kiro/docs/LANDING_PAGE_WORKFLOW.md` - Documentación completa del flujo de trabajo

## Funcionamiento en Desarrollo y Producción

### Desarrollo (http://127.0.0.1:5501/)
- El servidor de desarrollo sirve archivos directamente desde la raíz
- `index.html` se carga desde la raíz del proyecto
- Los recursos (css/, js/, img/, webfonts/) se cargan desde la raíz
- Editas los archivos en la raíz y se ven inmediatamente

### Producción (https://cuidoamitata.cl)
- GitHub Pages sirve archivos desde `dist/`
- `index.html` se copia automáticamente: raíz → `public/` → `dist/`
- Todos los recursos se copian: raíz → `public/` → `dist/`
- `app.html` se procesa por Vite y genera bundles en `dist/assets/`

### Sincronización Automática
El script `prebuild` ejecuta automáticamente:
1. `npm run sync:landing` - Copia TODOS los archivos editables de raíz a `public/`:
   - `index.html`, `manifest.json`
   - `css/`, `js/`, `img/`, `webfonts/`
2. `npm run build:css` - Compila Tailwind CSS

**Importante**: Siempre edita archivos en la RAÍZ, nunca en `public/`. La sincronización es automática.

## Build Exitoso

```bash
npm run build:css  # ✅ Compilado CSS de Tailwind
npm run build      # ✅ Build de producción completado
```

## Próximos Pasos

1. Hacer commit de los cambios:
```bash
git add .
git commit -m "fix: mover recursos estáticos a public/ para corregir 404 en producción"
git push origin main
```

2. GitHub Actions desplegará automáticamente a GitHub Pages

3. Verificar en producción:
   - Landing: https://cuidoamitata.cl
   - App React: https://cuidoamitata.cl/app.html

## Notas Técnicas

- El logo está SOLO en `img/CuidoAMiTata_Logo_500.png` (NO en la raíz)
- Todas las referencias usan rutas relativas: `img/`, `css/`, `js/` (sin `/` inicial)
- Los archivos editables están en la RAÍZ del proyecto para desarrollo
- `public/` contiene copias automáticas (NO editar manualmente)
- `index.html` (landing) NO es procesada por Vite, se copia tal cual
- `app.html` (React) SÍ es procesada por Vite y genera bundles optimizados
- Vite procesa el logo de `app.html` y lo copia a `/assets/` automáticamente
- El script `sync:landing` copia automáticamente: index.html, manifest.json, css/, js/, img/, webfonts/
- El build de producción elimina `console.log` automáticamente (configurado en `vite.config.ts`)
