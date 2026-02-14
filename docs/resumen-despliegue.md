# Resumen de configuración de despliegue

## Estado

El proyecto está preparado para desplegar en GitHub Pages.

## Documentación en `docs/`

- [README.md](README.md) – Índice de documentación.
- [configuracion-supabase.md](configuracion-supabase.md) – Supabase.
- [configuracion-proyecto.md](configuracion-proyecto.md) – Proyecto y scripts.
- [despliegue-github-pages.md](despliegue-github-pages.md) – GitHub Pages.
- [despliegue.md](despliegue.md) – Otras opciones (Vercel, Netlify, etc.).
- [lista-verificacion-produccion.md](lista-verificacion-produccion.md) – Checklist.
- [arquitectura.md](arquitectura.md) – Arquitectura.
- [api.md](api.md) – Referencia de API.
- [guia-usuario.md](guia-usuario.md) – Manual de usuario.

## Configuración técnica

- **GitHub Actions**: `.github/workflows/deploy.yml` (build y despliegue en push a `main`).
- **Vite**: `base: '/'` para dominio propio; `publicDir: 'public'`, `copyPublicDir: true`.
- **SPA**: se genera `404.html` desde `app.html` para que las rutas del React Router funcionen al refrescar.

## Cómo desplegar

1. Configurar **Secrets**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
2. **Settings** > **Pages** > Source: **GitHub Actions**.
3. Opcional: dominio personalizado y DNS.
4. `git push origin main` para disparar el despliegue.

[Volver al índice](README.md)
