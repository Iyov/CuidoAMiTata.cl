# Agente Cursor – Cuido a mi Tata (Chile)

Este archivo es la **guía principal para el agente de Cursor** (y agentes similares) en el proyecto CuidoAMiTata.cl. Síguelo antes y durante cualquier implementación o modificación.

**Aplicación automática**: En este proyecto, Cursor carga automáticamente el archivo **.cursorrules** (raíz) y las reglas con `alwaysApply: true` en `.cursor/rules/` (000 y 001). No hace falta indicar manualmente "lee el spec"; el agente recibe el contexto en cada conversación.

---

## Objetivo del proyecto

**Cuido a mi Tata** es una aplicación web para el cuidado de adultos mayores en **Chile**. El nombre usa la forma chilena de referirse a los abuelos. La identidad, el idioma y el contexto son chilenos (SENAMA, realidad familiar y sanitaria local). No se toma España ni otros países como marco principal.

**Cuatro servicios centrales** (prioridad de implementación):

1. **Gestión de medicación** – Alarmas y confirmación visual para no omitir dosis.
2. **Bitácora diaria** – Registro de comidas, ánimo y actividades por el cuidador.
3. **Multi-familiar** – Varios miembros de la familia bajo una misma cuenta/grupo, con roles.
4. **Botón de pánico** – Alerta instantánea a la familia en emergencias.

El resto de módulos (caídas, piel, nutrición, polifarmacia, cuidado ético) son soporte y ya existen en el proyecto; se mantienen y adaptan a Chile.

---

## Pasos al iniciar una tarea

1. **Leer la spec de implementación**  
   [.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md](.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md)  
   Contiene: instrucciones, mapa de archivos, tareas ordenadas y criterios de aceptación.

2. **Leer el contexto de producto**  
   [docs/NotebookLM.md](docs/NotebookLM.md)  
   Identidad Chile, cuatro servicios, Supabase, registro de usuarios, despliegue en GitHub Pages.

3. **Aplicar las reglas de `.cursor/rules/`**  
   - 000: Contexto proyecto (Chile, stack).  
   - 001: Spec principal (AGENT_SPEC + NotebookLM).  
   - 002: TypeScript y React (aliases, rutas, componentes).  
   - 003: Supabase único backend; GitHub Pages (Secrets, 404.html, basename).  
   - 004: Todo el texto visible en español de Chile.  
   - 005: Tests (Vitest), type-check y lint antes de cerrar.

4. **Modificar solo lo necesario**  
   Evitar cambios en archivos no relacionados con la tarea. Al añadir pantallas o rutas, actualizar `src/App.tsx`. Al añadir tablas o políticas en Supabase, documentar en `docs/` o en el spec.

---

## Restricciones (no saltarse)

| Regla | Detalle |
|-------|---------|
| **Idioma** | Todo lo visible al usuario en **español de Chile**. |
| **Backend** | Solo **Supabase** (Auth + PostgreSQL). No añadir Firebase, API propia ni otros backends. |
| **Landing** | `index.html` en la raíz (se copia a `public/` en build). Contenido orientado a Chile. |
| **SPA** | Entrada en `app.html`; código en `src/`. Rutas con basename para GitHub Pages. |
| **Variables de entorno** | Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Producción: GitHub Secrets. |
| **Despliegue** | No romper el build ni el workflow de GitHub Pages (404.html, basename). |

---

## Mapa de archivos

| Qué | Dónde |
|-----|--------|
| Spec para agente (tareas y criterios) | `.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md` |
| Producto y Chile | `docs/NotebookLM.md` |
| Índice de specs | `docs/SPECS.md` |
| Landing | `index.html` (raíz) |
| Entrada SPA | `app.html`, `src/main.tsx`, `src/App.tsx` |
| Pantallas | `src/screens/*.tsx` |
| Componentes | `src/components/*.tsx` |
| Auth y Supabase | `src/config/supabase.ts`, `src/services/AuthService.ts`, `src/services/SupabaseAuthService.ts` |
| Servicios y managers | `src/services/*.ts` |
| Tipos | `src/types/*.ts` |
| Rutas | `src/App.tsx` (Router, Routes) |
| Build y deploy | `vite.config.ts`, `.github/workflows/deploy.yml` |
| Despliegue (docs) | `docs/despliegue-github-pages.md`, `docs/lista-verificacion-produccion.md` |

---

## Checklist antes de dar por cerrado un cambio

- [ ] Se leyó AGENT_SPEC.md y docs/NotebookLM.md (o se tiene su contexto).
- [ ] Textos de usuario en español de Chile; no España como marco principal en la UI.
- [ ] No se introdujo otro backend; se usa Supabase para auth y datos.
- [ ] Rutas y build compatibles con GitHub Pages (basename, 404.html).
- [ ] Si se añadieron variables de entorno, están documentadas; producción usa GitHub Secrets.
- [ ] Si se añadieron tablas o políticas en Supabase, están documentadas en `docs/` o en el spec.
- [ ] `npm run type-check` pasa.
- [ ] `npm test` pasa (o los fallos están justificados y no son por el cambio).
- [ ] No se commitearon `.env.local` ni claves.

---

## Referencias rápidas

- **Configuración Supabase**: [docs/configuracion-supabase.md](docs/configuracion-supabase.md)  
- **Despliegue GitHub Pages**: [docs/despliegue-github-pages.md](docs/despliegue-github-pages.md)  
- **Arquitectura**: [docs/arquitectura.md](docs/arquitectura.md)  
- **API (servicios y componentes)**: [docs/api.md](docs/api.md)

Sigue el orden de tareas y los criterios de aceptación de **AGENT_SPEC.md** en cada implementación.
