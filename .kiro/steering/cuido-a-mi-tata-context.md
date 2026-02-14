---
inclusion: auto
---

# Contexto del Proyecto: Cuido a mi Tata

Este proyecto es una aplicación web para el cuidado de adultos mayores en Chile.

## Documentos clave que DEBES leer antes de hacer cambios:

1. **Contexto de producto**: #[[file:docs/NotebookLM.md]]
   - Identidad Chile, servicios centrales, stack técnico

2. **Guía para agentes**: #[[file:AGENTS.md]]
   - Pasos, restricciones, mapa de archivos, checklist

3. **Spec de implementación**: #[[file:.kiro/specs/cuido-a-mi-tata/AGENT_SPEC.md]]
   - Tareas ordenadas, criterios de aceptación

## Reglas críticas:

- **Idioma**: Todo en español de Chile
- **Backend**: Solo Supabase (no Firebase, no API propia)
- **Importaciones**: Directas, NO barrel exports
- **Despliegue**: GitHub Pages con Secrets de Supabase

## Servicios centrales (prioridad):

1. Gestión de medicación
2. Bitácora diaria
3. Multi-familiar
4. Botón de pánico
