# Solución de problemas en producción

Problemas habituales y correcciones aplicadas en el proyecto.

## App en blanco en GitHub Pages

### Causa 1: Supabase no configurado

Si los secrets `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` no están en GitHub, el código antiguo podía lanzar un error al cargar y dejar la pantalla en blanco.

**Solución aplicada**: La configuración de Supabase ya no lanza error si faltan variables; la app carga y el login falla con un mensaje claro. Para que el login funcione, configurar los dos secrets en **Settings** > **Secrets and variables** > **Actions**.

### Causa 2: Rutas del SPA (refresco)

Al refrescar en una ruta como `/app.html/medications`, GitHub Pages devolvía 404.

**Solución aplicada**: El workflow de despliegue copia `app.html` a `404.html`. Las rutas no encontradas sirven el mismo HTML del SPA y React Router muestra la pantalla correcta.

### Causa 3: Basename del Router

Si el `basename` de React Router no coincidía con la URL (por ejemplo con dominio personalizado o subruta del repo), las rutas podían fallar.

**Solución aplicada**: El basename se calcula a partir de `window.location.pathname` (por ejemplo `/app.html` o `/CuidoAMiTata.cl/app.html`).

### Causa 4: Errores no capturados

Cualquier error no capturado en React podía dejar la app en blanco.

**Solución aplicada**: La app está envuelta en un `ErrorBoundary` en `main.tsx`; se muestra una pantalla de error en lugar de pantalla blanca.

## Export 'X' is not defined

Problemas de code splitting con barrel exports (por ejemplo `AuthScreen`, `Alert`) en producción.

**Soluciones aplicadas en el proyecto**:

- `AuthScreen` se importa directamente en `App.tsx` (no lazy ni desde barrel).
- Se eliminó el barrel export de `AuthScreen` en `screens/index.ts` para evitar chunks duplicados.
- Componentes compartidos se importan desde archivos concretos (ej. `FeedbackAlert` en lugar de un barrel que falle).

Si aparece un error similar con otro componente, importar desde la ruta directa del archivo (ej. `import { X } from './components/X'`) y no desde `./components/index`.

## Recursos 404 (imágenes, CSS, JS)

- Los estáticos deben estar en `public/` (o en la raíz y copiados con `sync:landing` al hacer build).
- En `app.html` y en la app React usar rutas relativas a la raíz del sitio (por ejemplo `img/logo.png`) o absolutas con la base correcta (`base: '/'` en Vite para dominio propio).
- No editar `public/` a mano si se usa `sync:landing`; editar en la raíz y dejar que el script copie.

## Estructura recomendada

- **Raíz (editable)**: `index.html`, `manifest.json`, `css/`, `js/`, `img/`, `webfonts/`.
- **public/**: copia generada por `sync:landing` (prebuild) + `.nojekyll`, `CNAME`, etc.
- **app.html**: entrada de la app React; Vite la procesa y genera `dist/app.html` y `dist/assets/`.
- **dist/**: resultado del build; incluye `index.html`, `app.html`, `404.html`, `assets/`.

## Comandos útiles

```bash
npm run verify
npm run build
npm run preview
npm run type-check
```

[Volver al índice](README.md)
