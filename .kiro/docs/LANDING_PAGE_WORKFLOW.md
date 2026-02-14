# Flujo de Trabajo: Landing Page y Recursos Estáticos

## Estructura de Archivos

```
proyecto/
├── index.html              # ⭐ EDITA ESTE
├── manifest.json           # ⭐ EDITA ESTE
├── css/                    # ⭐ EDITA ESTOS
│   ├── input.css
│   ├── output.css
│   ├── index.css
│   └── font-awesome_6.5.1_all.min.css
├── js/                     # ⭐ EDITA ESTOS
│   └── index.js
├── img/                    # ⭐ EDITA ESTOS
│   └── CuidoAMiTata_Logo_500.png
├── webfonts/               # ⭐ EDITA ESTOS
│   └── *.woff2, *.ttf
├── public/                 # 🔄 Sincronización automática (NO editar)
│   ├── index.html         # Copia de raíz/index.html
│   ├── manifest.json      # Copia de raíz/manifest.json
│   ├── css/               # Copia de raíz/css/
│   ├── js/                # Copia de raíz/js/
│   ├── img/               # Copia de raíz/img/
│   ├── webfonts/          # Copia de raíz/webfonts/
│   ├── .nojekyll
│   ├── CNAME
│   ├── robots.txt
│   └── sitemap.xml
└── dist/                  # 📦 Build de producción
    ├── index.html         # Copiado desde public/
    ├── css/, js/, img/    # Copiados desde public/
    └── ...
```

## ¿Por qué esta estructura?

### Archivos en la RAÍZ (css/, js/, img/, webfonts/, index.html, manifest.json)
- **Propósito**: Desarrollo local con Live Server
- **Uso**: Cuando abres `http://127.0.0.1:5501/`
- **Edición**: ⭐ EDITA ESTOS ARCHIVOS

### Archivos en `public/`
- **Propósito**: Producción (copiados a `dist/`)
- **Uso**: Cuando Vite hace el build
- **Edición**: ❌ NO EDITAR - Se sincronizan automáticamente desde la raíz

## Sincronización Automática

Cuando ejecutas `npm run build`, automáticamente:

1. ✅ Sincroniza archivos editables de raíz → `public/`:
   - `index.html` → `public/index.html`
   - `manifest.json` → `public/manifest.json`
   - `css/` → `public/css/`
   - `js/` → `public/js/`
   - `img/` → `public/img/`
   - `webfonts/` → `public/webfonts/`
2. ✅ Compila CSS de Tailwind (`css/input.css` → `css/output.css`)
3. ✅ Ejecuta TypeScript compiler
4. ✅ Vite copia `public/` a `dist/`

## Comandos

### Desarrollo
```bash
# Servidor de desarrollo React (app.html)
npm run dev

# Para la landing (index.html), usa Live Server en tu editor
# o abre directamente index.html en el navegador
# Los archivos se cargan desde la raíz (css/, js/, img/)
```

### Producción
```bash
# Build completo (sincroniza automáticamente)
npm run build

# Solo sincronizar archivos editables a public/
npm run sync:landing

# Preview del build
npm run preview
```

## Flujo de Trabajo Recomendado

### 1. Editar Archivos en la RAÍZ
```bash
# Edita cualquiera de estos archivos:
code index.html          # Landing page
code css/index.css       # Estilos personalizados
code js/index.js         # Scripts de la landing
code manifest.json       # Configuración PWA

# Prueba con Live Server
# http://127.0.0.1:5501/
```

### 2. Build para Producción
```bash
# Esto sincroniza automáticamente TODO de raíz → public/
npm run build
```

### 3. Deploy
```bash
git add .
git commit -m "update: landing page y recursos"
git push origin main
```

## Archivos que SE SINCRONIZAN Automáticamente

✅ `index.html`
✅ `manifest.json`
✅ `css/` (todos los archivos)
✅ `js/` (todos los archivos)
✅ `img/` (todos los archivos)
✅ `webfonts/` (todos los archivos)

## Archivos que NO se sincronizan (ya están en public/)

❌ `.nojekyll`
❌ `CNAME`
❌ `robots.txt`
❌ `sitemap.xml`

Estos archivos están solo en `public/` porque no necesitan editarse frecuentemente.

## Rutas de Recursos

Todas las rutas en `index.html` deben ser relativas:

```html
<!-- ✅ Correcto -->
<link rel="icon" href="img/CuidoAMiTata_Logo_500.png" />
<link rel="stylesheet" href="css/output.css" />
<script src="js/index.js"></script>

<!-- ❌ Incorrecto -->
<link rel="icon" href="/img/CuidoAMiTata_Logo_500.png" />
<link rel="stylesheet" href="/css/output.css" />
```

## Troubleshooting

### Problema: Cambios en css/js no se ven en producción
**Solución**: Ejecuta `npm run sync:landing` antes de `npm run build`

### Problema: 404 en recursos (css, js, img)
**Solución**: Verifica que los recursos estén en la RAÍZ (css/, js/, img/), no solo en public/

### Problema: Archivos en raíz y public/ están desincronizados
**Solución**: Ejecuta `npm run sync:landing` para sincronizar

### Problema: Edité un archivo en public/ y se perdió
**Solución**: NUNCA edites archivos en public/. Siempre edita en la raíz y ejecuta `npm run sync:landing`

## Notas Importantes

1. **Siempre edita archivos en la RAÍZ**, nunca en `public/`
2. El script `prebuild` sincroniza automáticamente antes de cada build
3. Los recursos estáticos editables (css, js, img) están en la raíz
4. La landing page NO es procesada por Vite (se copia tal cual)
5. La app React (`app.html`) SÍ es procesada por Vite
6. El CSS de Tailwind se compila automáticamente antes del build
