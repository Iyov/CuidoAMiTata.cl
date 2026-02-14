# Despliegue en GitHub Pages

Guía para desplegar CuidoAMiTata.cl en GitHub Pages (con o sin dominio personalizado).

## Requisitos

- Repositorio en GitHub.
- Proyecto de Supabase configurado (recomendado).
- Dominio personalizado opcional (ej. cuidoamitata.cl).

## Configuración inicial

### 1. Secrets de GitHub

Para que el build tenga las variables de Supabase:

1. Repositorio > **Settings** > **Secrets and variables** > **Actions**.
2. **New repository secret**.
3. Añadir:
   - **VITE_SUPABASE_URL**: URL del proyecto Supabase.
   - **VITE_SUPABASE_ANON_KEY**: Clave anónima (anon key).

### 2. GitHub Pages

1. **Settings** > **Pages**.
2. En «Build and deployment»: **Source** = **GitHub Actions**.
3. Guardar.

### 3. Dominio personalizado (opcional)

1. **Settings** > **Pages** > **Custom domain**: ej. `cuidoamitata.cl`.
2. **Save** y activar **Enforce HTTPS** cuando esté disponible.

### 4. DNS (si usas dominio propio)

En tu proveedor de dominio:

```
Tipo   Nombre   Valor
A      @        185.199.108.153
A      @        185.199.109.153
A      @        185.199.110.153
A      @        185.199.111.153
CNAME  www      tu-usuario.github.io
```

Puede tardar 10–30 minutos en propagarse.

## Proceso de despliegue

### Automático

Al hacer push a `main`:

```bash
git add .
git commit -m "Tu mensaje"
git push origin main
```

El workflow:

1. Instala dependencias.
2. Compila Tailwind CSS.
3. Ejecuta tests (opcionales, no bloquean).
4. Compila con Vite.
5. Genera `404.html` para el SPA (refresco en rutas).
6. Sube el artefacto y despliega en GitHub Pages.

### Manual

En GitHub: **Actions** > «Deploy to GitHub Pages» > **Run workflow**.

## Verificación

### Local antes de subir

```bash
npm run verify
npm run build
npm run preview
```

### Tras el despliegue

1. **Actions**: comprobar que el workflow termina en verde.
2. Visitar:
   - Con dominio: `https://cuidoamitata.cl`
   - Sin dominio: `https://tu-usuario.github.io/CuidoAMiTata.cl`
3. App React: `https://tu-dominio/app.html`.

## Solución de problemas

- **Build falla**: ejecutar `npm run build` y `npm run type-check` en local.
- **Dominio no carga**: revisar DNS, esperar propagación, comprobar CNAME.
- **Assets 404**: con dominio propio usar `base: '/'` en `vite.config.ts`; sin dominio `base: '/CuidoAMiTata.cl/'`.
- **Tests fallan**: no bloquean el despliegue; el sitio se publica igual.

## Contenido de `dist/`

Tras el build:

- `index.html` – Landing.
- `app.html` – Aplicación React.
- `404.html` – Copia de `app.html` para rutas del SPA.
- `assets/` – JS y CSS.
- `CNAME`, `.nojekyll` (si aplican).

## Comandos útiles

```bash
npm run verify
npm run build
npm run preview
npm test
npm run build:css
npm run type-check
```

## Checklist antes del primer despliegue

- [ ] Secrets configurados (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
- [ ] Pages con Source: GitHub Actions.
- [ ] Dominio y DNS (si aplica).
- [ ] `npm run verify` y `npm run build` correctos.

[Volver al índice](README.md)
