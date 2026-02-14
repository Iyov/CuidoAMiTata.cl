# Guía de despliegue (Vercel, Netlify, GitHub Pages, etc.)

Opciones para desplegar CuidoAMiTata en distintos proveedores.

## Preparación

```bash
npm run type-check
npm test
npm run lint
npm run format:check
```

Variables de entorno típicas en producción:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build local:

```bash
npm run build:css
npm run build
npm run preview
```

## GitHub Pages

Recomendado para este proyecto. Ver **[despliegue-github-pages.md](despliegue-github-pages.md)**.

- Source: GitHub Actions.
- Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Con dominio propio: `base: '/'` en `vite.config.ts`.

## Vercel

1. Conectar el repositorio en vercel.com.
2. Build command: `npm run build && npm run build:css`
3. Output directory: `dist`
4. Añadir variables de entorno (Supabase).
5. Opcional: `vercel.json` con rewrites para SPA si se sirve la app en la raíz.

## Netlify

1. Conectar el repositorio en netlify.com.
2. Build command: `npm run build && npm run build:css`
3. Publish directory: `dist`
4. Variables de entorno en Site settings.
5. Opcional: `netlify.toml` con redirects para SPA (`/*` → `/index.html` o `/app.html`).

## Firebase Hosting

1. `firebase init hosting`
2. Directorio público: `dist`
3. Configurar variables en Firebase (o usar env en build).
4. `npm run build && npm run build:css && firebase deploy`

## Variables de entorno en producción

En todos los casos, configurar en el panel del proveedor:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

No incluir `.env.local` en el repositorio; usarlo solo en desarrollo.

[Volver al índice](README.md)
