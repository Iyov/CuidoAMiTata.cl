# Guía para agentes IA (Cursor, Kiro, VS Code, etc.)

Este proyecto es **Cuido a mi Tata** (CuidoAMiTata.cl): una aplicación web para el cuidado de adultos mayores en **Chile**.

## Antes de codificar

1. **Lee la spec de implementación**:  
   [.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md](.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md)  
   Ahí están las instrucciones para el agente, el mapa de archivos y las tareas ordenadas.

2. **Contexto de producto (Chile y servicios)**:  
   [docs/NotebookLM.md](docs/NotebookLM.md)  
   Identidad chilena, cuatro servicios centrales (medicación, bitácora, multi-familiar, botón de pánico), Supabase y despliegue.

## Reglas rápidas

- **Idioma**: Todo lo visible al usuario en **español de Chile**.
- **Backend**: Solo **Supabase** (Auth + PostgreSQL). No añadir otros backends.
- **Landing**: `index.html` (raíz). **App React**: `app.html` + `src/`. Rutas preparadas para **GitHub Pages** (basename, 404.html).
- **Despliegue**: Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en GitHub Secrets; ver [docs/despliegue-github-pages.md](docs/despliegue-github-pages.md).

## Archivos clave

| Qué | Dónde |
|-----|--------|
| Spec para agente | `.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md` |
| Producto y Chile | `docs/NotebookLM.md` |
| Landing | `index.html` |
| SPA React | `app.html`, `src/App.tsx`, `src/screens/` |
| Auth y DB | `src/config/supabase.ts`, `src/services/AuthService.ts` |
| Despliegue | `.github/workflows/deploy.yml`, [docs/despliegue-github-pages.md](docs/despliegue-github-pages.md) |

Sigue el orden de tareas y los criterios de aceptación indicados en **AGENT_SPEC.md**.
