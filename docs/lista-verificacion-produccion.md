# Lista de verificación para producción

Use este checklist antes y después de cada despliegue.

## Pre-despliegue

### Código y calidad

- [ ] Las pruebas pasan (`npm test`)
- [ ] Type check correcto (`npm run type-check`)
- [ ] Lint sin errores (`npm run lint`)
- [ ] Formato correcto (`npm run format:check`)
- [ ] Cobertura aceptable (`npm run test:coverage`), objetivo ≥ 80 %

### Funcionalidad

- [ ] Pantallas cargan correctamente
- [ ] Navegación y formularios funcionan
- [ ] Validaciones y notificaciones correctas
- [ ] Modo offline y sincronización
- [ ] Tema claro/oscuro
- [ ] Exportación PDF (si aplica)

### Seguridad

- [ ] Variables de entorno configuradas (Supabase)
- [ ] HTTPS habilitado
- [ ] Sin credenciales en el código
- [ ] Auto-logout operativo (15 min)

### Build

- [ ] `npm run build` sin errores
- [ ] `npm run build:css` sin errores
- [ ] `npm run preview` y revisión manual

## GitHub Pages

- [ ] Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Pages > Source: GitHub Actions
- [ ] Dominio y DNS (si aplica)
- [ ] CNAME y .nojekyll en `public/` (si aplica)

## Post-despliegue

- [ ] La aplicación carga en la URL de producción
- [ ] Login funciona
- [ ] Rutas del SPA funcionan (incluido refresco)
- [ ] Sin errores críticos en consola
- [ ] Recursos (JS, CSS, imágenes) cargan

## Rollback

Si hay errores críticos:

1. Identificar el commit estable anterior.
2. Revertir o desplegar ese commit a `main`.
3. El workflow volverá a desplegar esa versión.

[Volver al índice](README.md)
