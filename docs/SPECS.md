# Especificaciones del proyecto – Cuido a mi Tata

Este documento es el **índice de especificaciones** para diseñadores, desarrolladores y agentes IA que trabajan en CuidoAMiTata.cl.

## Para agentes de programación (IA)

### Agente Cursor (configuración completa)

- **Brief del agente (raíz)**: [AGENTS.md](../AGENTS.md)  
  → Objetivo del proyecto, pasos al iniciar una tarea, restricciones, mapa de archivos y checklist. **Empieza aquí si eres el agente de Cursor.**

- **Reglas de Cursor** (se aplican automáticamente en el proyecto):  
  [.cursor/rules/](../.cursor/rules/)  
  - `000-project-brief.mdc` – Contexto Cuido a mi Tata (Chile), stack.  
  - `001-cuidoamitata-spec.mdc` – Spec principal (AGENT_SPEC + NotebookLM).  
  - `002-typescript-react.mdc` – Convenciones TypeScript y React.  
  - `003-supabase-and-deploy.mdc` – Supabase único backend; GitHub Pages.  
  - `004-spanish-chile-ux.mdc` – Todo el texto visible en español de Chile.  
  - `005-testing-and-quality.mdc` – Vitest, type-check, lint.

- **Spec de implementación (tareas y criterios)**:  
  [.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md](../.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md)  
  → Mapa de archivos, tareas ordenadas y criterios de aceptación.

- **Contexto de producto (Chile y funcionalidades)**:  
  [docs/NotebookLM.md](NotebookLM.md)  
  → Identidad Chile, cuatro servicios, Supabase, registro y despliegue.

## Para humanos

- **Producto y alcance (Chile)**: [NotebookLM.md](NotebookLM.md)  
  Identidad, servicios centrales (medicación, bitácora, multi-familiar, botón de pánico), Supabase, registro de usuarios y despliegue en GitHub Pages.

- **Requisitos detallados (Kiro)**: [.kiro/specs/cuido-a-mi-tata/requirements.md](../.kiro/specs/cuido-a-mi-tata/requirements.md)  
  Historias de usuario y criterios de aceptación por módulo (pueden adaptarse a Chile).

- **Diseño técnico (Kiro)**: [.kiro/specs/cuido-a-mi-tata/design.md](../.kiro/specs/cuido-a-mi-tata/design.md)  
  Arquitectura y componentes (referencia; el stack actual está descrito en [NotebookLM.md](NotebookLM.md) y en [arquitectura.md](arquitectura.md)).

- **Configuración y despliegue**:  
  [configuracion-supabase.md](configuracion-supabase.md), [despliegue-github-pages.md](despliegue-github-pages.md), [lista-verificacion-produccion.md](lista-verificacion-produccion.md).

## Resumen de alcance

| Ámbito | Contenido |
|--------|-----------|
| **Identidad** | Chile; "Cuido a mi Tata"; español chileno; SENAMA, realidad local. |
| **Servicios centrales** | (1) Gestión de medicación, (2) Bitácora diaria, (3) Multi-familiar, (4) Botón de pánico. |
| **Stack** | React (TypeScript), Vite, Tailwind, Supabase (Auth + PostgreSQL), GitHub Pages. |
| **Archivos a modificar** | `index.html`, `app.html`, `src/App.tsx`, `src/screens/*`, `src/services/*`, `src/config/supabase.ts`, etc. Ver AGENT_SPEC.md. |

Las modificaciones en **index.html** y en la **App React** deben alinearse con [NotebookLM.md](NotebookLM.md) y con las tareas definidas en [AGENT_SPEC.md](../.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md).
