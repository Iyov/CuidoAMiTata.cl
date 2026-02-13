# Checklist de Producción - CuidoAMiTata

Use este checklist antes de cada despliegue a producción.

## Pre-Despliegue

### Código y Calidad

- [ ] Todas las pruebas unitarias pasan (`npm test`)
- [ ] Todas las pruebas de propiedades (PBT) pasan
- [ ] Cobertura de código > 80% (`npm run test:coverage`)
- [ ] Type check sin errores (`npm run type-check`)
- [ ] Lint sin errores (`npm run lint`)
- [ ] Formato de código correcto (`npm run format:check`)
- [ ] No hay console.log en código de producción
- [ ] No hay TODOs críticos pendientes

### Funcionalidad

- [ ] Todas las pantallas cargan correctamente
- [ ] Navegación entre pantallas funciona
- [ ] Formularios se envían correctamente
- [ ] Validaciones funcionan correctamente
- [ ] Notificaciones se emiten correctamente
- [ ] Alertas duales funcionan (audio + visual)
- [ ] Modo offline funciona
- [ ] Sincronización funciona al reconectar
- [ ] Tema oscuro/claro funciona
- [ ] Cambio entre pacientes funciona
- [ ] Exportación PDF funciona
- [ ] Carga de fotografías funciona

### Seguridad

- [ ] Variables de entorno configuradas
- [ ] Clave de cifrado generada y segura
- [ ] Tokens JWT configurados
- [ ] HTTPS habilitado
- [ ] Headers de seguridad configurados
- [ ] Auto-logout funciona (15 minutos)
- [ ] Datos sensibles cifrados
- [ ] No hay credenciales en el código
- [ ] CORS configurado correctamente

### Rendimiento

- [ ] Build de producción optimizado
- [ ] CSS compilado y minificado
- [ ] Imágenes optimizadas
- [ ] Code splitting configurado
- [ ] Lazy loading implementado
- [ ] Carga inicial < 3 segundos
- [ ] Respuesta UI < 100ms
- [ ] Lighthouse score > 80

### Documentación

- [ ] README.md actualizado
- [ ] CHANGELOG.md actualizado
- [ ] Versión incrementada en package.json
- [ ] API.md actualizado si hay cambios
- [ ] USER_GUIDE.md actualizado si hay cambios
- [ ] Comentarios de código actualizados

### Git

- [ ] Rama develop mergeada a main
- [ ] Conflictos resueltos
- [ ] Commit message descriptivo
- [ ] Tag de versión creado (ej: v1.0.0)
- [ ] Push a repositorio remoto

## Configuración de Entorno

### Variables de Entorno Producción

- [ ] VITE_API_URL configurada
- [ ] VITE_SENTRY_DSN configurada
- [ ] VITE_GA_TRACKING_ID configurada
- [ ] VITE_STORAGE_ENCRYPTION_KEY configurada
- [ ] VITE_VAPID_PUBLIC_KEY configurada
- [ ] VITE_ENABLE_ANALYTICS=true
- [ ] VITE_ENABLE_SENTRY=true
- [ ] VITE_APP_ENVIRONMENT=production

### Servicios Externos

- [ ] Cuenta de Sentry creada y configurada
- [ ] Cuenta de Google Analytics creada y configurada
- [ ] Cuenta de Google Tag Manager creada (opcional)
- [ ] VAPID keys generadas para notificaciones push
- [ ] Backend API desplegado y accesible
- [ ] Base de datos configurada y migrada

## Despliegue

### Build

- [ ] `npm run build` ejecutado sin errores
- [ ] `npm run build:css` ejecutado sin errores
- [ ] Carpeta `dist/` generada correctamente
- [ ] Archivos estáticos en `dist/assets/`
- [ ] index.html generado correctamente

### Preview Local

- [ ] `npm run preview` ejecutado
- [ ] Aplicación accesible en http://localhost:4173
- [ ] Todas las funcionalidades probadas localmente
- [ ] No hay errores en consola del navegador
- [ ] Network tab muestra recursos cargando correctamente

### Plataforma de Hosting

#### Vercel
- [ ] Proyecto creado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado configurado
- [ ] SSL/TLS habilitado
- [ ] Build hooks configurados (opcional)

#### Netlify
- [ ] Proyecto creado en Netlify
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado configurado
- [ ] SSL/TLS habilitado
- [ ] Build hooks configurados (opcional)

#### GitHub Pages
- [ ] GitHub Actions configurado
- [ ] Secrets configurados en repositorio
- [ ] GitHub Pages habilitado
- [ ] Dominio personalizado configurado (opcional)

### Despliegue Ejecutado

- [ ] Comando de despliegue ejecutado
- [ ] Build exitoso en plataforma
- [ ] Despliegue completado sin errores
- [ ] URL de producción accesible

## Post-Despliegue

### Verificación Funcional

- [ ] Aplicación carga en URL de producción
- [ ] Todas las rutas accesibles
- [ ] Login funciona
- [ ] Crear paciente funciona
- [ ] Programar medicamento funciona
- [ ] Recibir notificación funciona
- [ ] Confirmar administración funciona
- [ ] Registrar evento funciona
- [ ] Ver historial funciona
- [ ] Exportar PDF funciona
- [ ] Modo offline funciona
- [ ] Sincronización funciona

### Verificación Técnica

- [ ] No hay errores en consola del navegador
- [ ] No hay errores 404 en Network tab
- [ ] Recursos estáticos cargan correctamente
- [ ] API responde correctamente
- [ ] HTTPS funciona correctamente
- [ ] Certificado SSL válido
- [ ] Headers de seguridad presentes

### Rendimiento

- [ ] Lighthouse audit ejecutado
- [ ] Performance score > 80
- [ ] Accessibility score > 90
- [ ] Best Practices score > 90
- [ ] SEO score > 95
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Largest Contentful Paint < 2.5s

### SEO

- [ ] Google Search Console configurado
- [ ] Sitemap enviado a Google
- [ ] Robots.txt accesible
- [ ] Meta tags presentes
- [ ] Open Graph tags presentes
- [ ] Structured data válido
- [ ] Rich Results Test sin errores

### Monitoreo

- [ ] Sentry recibiendo eventos
- [ ] Google Analytics recibiendo datos
- [ ] Uptime monitoring configurado
- [ ] Alertas configuradas
- [ ] Dashboard de monitoreo accesible

### Seguridad

- [ ] SSL Labs test ejecutado (A+ rating)
- [ ] Security Headers test ejecutado
- [ ] OWASP ZAP scan ejecutado (opcional)
- [ ] No hay vulnerabilidades críticas
- [ ] Dependencias actualizadas

### Documentación

- [ ] URL de producción documentada
- [ ] Credenciales de servicios guardadas de forma segura
- [ ] Runbook de operaciones actualizado
- [ ] Procedimiento de rollback documentado
- [ ] Contactos de emergencia actualizados

## Comunicación

### Equipo

- [ ] Equipo de desarrollo notificado
- [ ] Equipo de QA notificado
- [ ] Equipo de soporte notificado
- [ ] Stakeholders notificados

### Usuarios

- [ ] Anuncio de nueva versión (si aplica)
- [ ] Notas de release publicadas
- [ ] Guía de nuevas funcionalidades (si aplica)
- [ ] Canales de soporte actualizados

## Rollback Plan

### Preparación

- [ ] Versión anterior identificada
- [ ] Comando de rollback documentado
- [ ] Backup de base de datos (si aplica)
- [ ] Tiempo estimado de rollback conocido

### Criterios de Rollback

Ejecutar rollback si:
- [ ] Errores críticos en producción
- [ ] Pérdida de funcionalidad principal
- [ ] Problemas de seguridad
- [ ] Rendimiento inaceptable
- [ ] Pérdida de datos

### Procedimiento de Rollback

1. [ ] Identificar problema
2. [ ] Notificar al equipo
3. [ ] Ejecutar comando de rollback
4. [ ] Verificar versión anterior funciona
5. [ ] Notificar a usuarios (si aplica)
6. [ ] Investigar causa raíz
7. [ ] Planificar fix

## Métricas de Éxito

### Inmediatas (Primeras 24 horas)

- [ ] Tasa de error < 1%
- [ ] Tiempo de respuesta promedio < 500ms
- [ ] Uptime > 99.9%
- [ ] No hay rollbacks
- [ ] Feedback de usuarios positivo

### Corto Plazo (Primera semana)

- [ ] Usuarios activos diarios estables o creciendo
- [ ] Tasa de retención > 80%
- [ ] NPS (Net Promoter Score) > 50
- [ ] Tickets de soporte < 10 por día
- [ ] Cobertura de funcionalidades > 90%

## Notas

**Fecha de Despliegue**: _______________

**Versión**: _______________

**Responsable**: _______________

**Aprobado por**: _______________

**Observaciones**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Firma

**Desarrollador**: _________________ Fecha: _______

**QA**: _________________ Fecha: _______

**DevOps**: _________________ Fecha: _______

**Product Owner**: _________________ Fecha: _______

---

**Última actualización**: 2026-02-13
**Versión del Checklist**: 1.0.0
