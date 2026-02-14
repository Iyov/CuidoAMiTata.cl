# Spec para agente IA – Cuido a mi Tata (Chile)

> **Uso**: Este documento es la especificación principal para que un agente de programación (Cursor, Kiro, VS Code Copilot, etc.) implemente o modifique el proyecto CuidoAMiTata.cl. Léelo antes de hacer cambios. El contexto de producto completo está en [docs/NotebookLM.md](../../../docs/NotebookLM.md).

---

## Instrucciones para el agente

1. **Contexto obligatorio**: Antes de codificar, lee [docs/NotebookLM.md](../../../docs/NotebookLM.md) para identidad (Chile, "Cuido a mi Tata"), servicios centrales y stack.
2. **Idioma**: Todo el contenido visible al usuario (UI, mensajes, documentación de usuario) debe estar en **español de Chile**.
3. **Alcance**: Las funcionalidades prioritarias son las cuatro del spec: (1) Gestión de medicación, (2) Bitácora diaria, (3) Multi-familiar, (4) Botón de pánico. El resto son soporte.
4. **Backend**: Autenticación y persistencia con **Supabase** (Auth + PostgreSQL). No inventar otro backend.
5. **Frontend**: React (TypeScript) en `src/`, entrada SPA en `app.html`. Landing en `index.html` (raíz; se copia a `public/` en build).
6. **Despliegue**: El sitio debe seguir desplegando correctamente en **GitHub Pages** (Vite, Secrets de Supabase, 404.html para SPA). Ver [docs/despliegue-github-pages.md](../../../docs/despliegue-github-pages.md).

---

## Mapa de archivos relevantes

| Ámbito | Archivos / carpetas |
|--------|---------------------|
| Landing (público, SEO, Chile) | `index.html` (raíz), `public/index.html` (copia en build) |
| Entrada SPA React | `app.html`, `src/main.tsx`, `src/App.tsx` |
| Pantallas (rutas) | `src/screens/*.tsx` |
| Componentes reutilizables | `src/components/*.tsx` |
| Lógica de negocio y servicios | `src/services/*.ts`, `src/config/supabase.ts` |
| Tipos y modelos | `src/types/*.ts` |
| Rutas y navegación | `src/App.tsx` (Router, Routes, basename) |
| Autenticación | `src/config/supabase.ts`, `src/services/AuthService.ts`, `src/services/SupabaseAuthService.ts`, `src/screens/AuthScreen.tsx` |
| Estilos globales | `src/index.css`, `css/input.css`, Tailwind |
| Build y despliegue | `vite.config.ts`, `package.json`, `.github/workflows/deploy.yml` |
| Documentación producto | `docs/NotebookLM.md` |
| Documentación técnica | `docs/despliegue-github-pages.md`, `docs/configuracion-supabase.md`, `docs/arquitectura.md` |

---

## Tareas de implementación (orden sugerido)

### 1. Identidad Chile en landing y app

- **index.html** (y si aplica `public/index.html`): Textos, meta tags y referencias a Chile (SENAMA, cuidado en Chile, español chileno). Eliminar o reemplazar referencias a España/SEGG como marco principal.
- **src/App.tsx** y pantallas: Títulos, mensajes de bienvenida y navegación en español chileno; sin términos exclusivos de otros países.
- **Criterio de aceptación**: Un usuario chileno percibe la app como pensada para Chile; no aparece España como contexto principal en la UI ni en la landing.

### 2. Servicios centrales ya existentes vs. por desarrollar

- **Ya en el proyecto**: Gestión de medicación (pantallas y managers en `src/screens/`, `src/services/`), prevención de caídas, integridad de piel, nutrición, polifarmacia, cuidado ético. Mantener y adaptar textos a Chile.
- **Por reforzar o añadir**:
  - **Bitácora diaria**: Pantalla(s) o flujo para registrar comidas, ánimo y actividades por paciente y fecha. Persistir en Supabase (tabla/s de bitácora).
  - **Multi-familiar**: Modelo de datos en Supabase (familias/grupos, miembros, roles). RLS para aislar datos por familia. En la app: selector de familia/grupo, gestión de miembros e invitaciones si aplica.
  - **Botón de pánico**: Componente o pantalla con botón visible que registre evento de emergencia en Supabase y dispare notificación a contactos del grupo (email como mínimo; push/WhatsApp como evolución).
- **Criterio de aceptación**: Los cuatro servicios (medicación, bitácora, multi-familiar, botón de pánico) están presentes o trazados en código y en Supabase.

### 3. Supabase: auth, perfiles y datos

- **Auth**: Ya configurado (Supabase Auth). Mantener `src/config/supabase.ts` y flujo de login/registro.
- **Perfiles**: Tabla `profiles` (y si aplica `families`, `family_members`) con roles (admin, cuidador, familiar) y vinculación a grupo familiar. Documentar o crear migraciones SQL en el repo o en `docs/` si se añaden tablas.
- **Datos de la app**: Medicación, bitácora, eventos de pánico, pacientes, etc., en tablas Supabase con RLS. La app debe leer/escribir en Supabase para estos datos; IndexedDB/local puede usarse como caché u offline.
- **Criterio de aceptación**: Registro de usuarios y perfilamiento (rol, familia) funcionan; los datos de la app se persisten en Supabase según el diseño acordado.

### 4. index.html (landing)

- Contenido y copy orientados a Chile y a “Cuido a mi Tata”.
- Enlaces claros a la app (p. ej. `/app.html`).
- Meta tags, títulos y descripciones en español chileno; sin referencias a España como contexto principal.
- **Criterio de aceptación**: La landing es coherente con la identidad Chile y enlaza correctamente a la SPA.

### 5. App React: rutas y navegación

- **App.tsx**: Rutas para los cuatro servicios y módulos de soporte. Basename correcto para GitHub Pages (p. ej. `/app.html`).
- **Navegación**: Enlaces o menú a Gestión de medicación, Bitácora diaria, Multi-familiar (o “Mi familia/grupo”), Botón de pánico, y al resto de módulos.
- **Criterio de aceptación**: Todas las funcionalidades principales son accesibles desde la app; las rutas funcionan en producción (incluido refresco con 404.html).

### 6. Despliegue en GitHub Pages

- **Secrets**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` documentados y usados en el workflow.
- **Workflow**: Build con Vite, generación de `404.html` desde `app.html`, subida del artefacto a GitHub Pages.
- **Documentación**: Enlaces desde este spec a [docs/despliegue-github-pages.md](../../../docs/despliegue-github-pages.md) y [docs/lista-verificacion-produccion.md](../../../docs/lista-verificacion-produccion.md).
- **Criterio de aceptación**: Tras push a `main` (o ejecución del workflow), el sitio carga en GitHub Pages; el login con Supabase funciona si los Secrets están configurados.

---

## Referencias rápidas

- **Producto y contexto Chile**: [docs/NotebookLM.md](../../../docs/NotebookLM.md)
- **Configuración Supabase**: [docs/configuracion-supabase.md](../../../docs/configuracion-supabase.md)
- **Despliegue GitHub Pages**: [docs/despliegue-github-pages.md](../../../docs/despliegue-github-pages.md)
- **Arquitectura**: [docs/arquitectura.md](../../../docs/arquitectura.md)
- **Requisitos detallados (legacy, puede adaptarse a Chile)**: [requirements.md](./requirements.md)
- **Diseño técnico (legacy)**: [design.md](./design.md)

---

## Checklist antes de cerrar un cambio

- [ ] Textos de usuario en español de Chile; sin España como marco principal en la UI.
- [ ] No se introduce otro backend; se usa Supabase para auth y datos.
- [ ] Rutas y build compatibles con GitHub Pages (basename, 404.html).
- [ ] Si se añaden variables de entorno, documentar en `docs/` y en README o SPECS; producción usa GitHub Secrets.
- [ ] Si se añaden tablas o políticas en Supabase, documentar o incluir SQL en el repo/docs.
