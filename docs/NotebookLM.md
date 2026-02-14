# Cuido a mi Tata – Especificaciones y guía de implementación

## Identidad y contexto: Chile

**Cuido a mi Tata** (CuidoAMiTata.cl) es una aplicación web centrada en el cuidado de adultos mayores en **Chile**. El nombre usa la forma muy chilena de referirse a los abuelos (“la tata”, “el tata”), y la solución está pensada para la realidad familiar, sanitaria y normativa chilena.

- **Idioma e identidad**: Español de Chile (usted/tú según contexto, términos locales, formatos de fecha y hora de Chile).
- **Marco de referencia**: Realidad del cuidado en hogares chilenos, SENAMA, sistema de salud (Fonasa/Isapres), redes de apoyo familiar y cuidadores.
- **No se toman como base** regulaciones o marcos de otros países (p. ej. España/SEGG); se pueden citar como evidencia internacional, pero las prioridades y el encuadre son chilenos.

---

## Servicios centrales de la aplicación

La app se organiza en torno a **cuatro servicios principales**:

1. **Gestión de medicación**  
   Alarmas y confirmación visual para que no se omita ninguna dosis (recordatorios, ventana de adherencia, justificación de omisiones).

2. **Bitácora diaria**  
   Registro por parte del cuidador de comidas, ánimo y actividades del adulto mayor.

3. **Multi-familiar**  
   Varios miembros de la familia (hermanos, hijos, otros cuidadores) conectados bajo una misma cuenta o grupo familiar, con roles y permisos claros.

4. **Botón de pánico**  
   Alerta instantánea a toda la familia o círculo designado en caso de emergencia.

El resto de funcionalidades (prevención de caídas, integridad de piel, nutrición, polifarmacia, cuidado ético) se integran como soporte a estos cuatro pilares y se describen más abajo en clave chilena.

---

## Stack técnico, datos y Supabase

### Tecnología actual

- **Frontend**: React (TypeScript), Vite, Tailwind CSS, React Router.
- **Autenticación y base de datos**: **Supabase** (Auth + PostgreSQL).
- **Hosting**: GitHub Pages (SPA estática con flujo de despliegue definido).

### ¿Se pueden guardar los datos de la app en Supabase?

**Sí.** Supabase permite:

- **Autenticación**: registro, login, sesión, recuperación de contraseña.
- **Base de datos PostgreSQL**: tablas para usuarios, perfiles, pacientes, medicación, bitácora, alertas, etc.
- **Row Level Security (RLS)**: que cada usuario o familia solo vea sus propios datos.
- **APIs automáticas** (REST/GraphQL) sobre esas tablas.

Todo lo que la app registre (medicación, bitácora, eventos de pánico, perfiles) puede persistirse en Supabase.

### Qué va en Supabase (resumen)

| Ámbito        | Uso en Supabase |
|---------------|------------------|
| Usuarios      | Auth (email/contraseña). Tabla `profiles`: nombre, rol, familia. |
| Perfiles      | Roles: admin, cuidador, familiar. Vinculación a “familia” o grupo. |
| Multi-familiar| Tabla de “familias” o grupos; usuarios asociados a un grupo; RLS por grupo. |
| Medicación    | Tablas de medicamentos, horarios, tomas registradas, omisiones justificadas. |
| Bitácora      | Registros de comidas, ánimo, actividades (por fecha y paciente). |
| Botón de pánico | Eventos de emergencia con timestamp; notificaciones a contactos de la familia. |
| Otros         | Pacientes, prevención de caídas, piel, nutrición, etc., según diseño de tablas. |

La app React actual puede seguir usando IndexedDB/local para caché y uso offline, y Supabase como fuente de verdad y sincronización cuando haya conexión.

---

## Registro de usuarios y perfilamiento

- **Registro**: Cualquier persona puede registrarse (email + contraseña) vía Supabase Auth. Opcional: invitación por enlace para “multi-familiar”.
- **Perfilamiento**:
  - **Perfil básico**: nombre, email, teléfono (opcional).
  - **Rol**: administrador del grupo, cuidador principal, familiar (solo lectura o permisos limitados), etc.
  - **Vinculación a familia/grupo**: al registrarse o después, el usuario se asocia a un “hogar” o “familia” (tabla en Supabase). Los miembros del mismo grupo ven los mismos pacientes y bitácoras según su rol.
- **Gestión**: Un admin puede invitar a más miembros (por email o enlace), asignar roles y desvincular usuarios. Todo esto se modela en Supabase (tablas `profiles`, `families`, `family_members`, etc.).

---

## Especificaciones funcionales (adaptadas a Chile)

A continuación se describen los módulos de la app en línea con los cuatro servicios y con identidad chilena.

### 1. Gestión de medicación (alarmas y confirmación visual)

- **Alarmas duales**: notificación visual + sonora para cada dosis programada.
- **Confirmación de toma**: registro con fecha y hora (timestamp) al marcar “dosis administrada”.
- **Ventana de adherencia**: margen (ej. 3 horas) respecto a la hora programada; fuera de esa ventana se marca “fuera de horario” o “no administrada”.
- **Justificación obligatoria** si se omite una dosis (motivo breve).
- **Hoja de medicación**: nombre del medicamento, posología, “para qué sirve”, stock y caducidad. Exportación a PDF para urgencias (entrega en SAPU, consultorio o clínica en Chile).

Referencia local: adherencia al tratamiento en adultos mayores en Chile; uso en contexto de polifarmacia y redes de salud.

### 2. Bitácora diaria

- **Registro por el cuidador** de:
  - Comidas (desayuno, almuerzo, cena, colaciones).
  - Ánimo (escala simple o etiquetas: bien, regular, bajo, irritable, etc.).
  - Actividades (paseo, visitas, terapia, reposo, etc.).
- **Por paciente y por fecha**: cada “tata” o adulto mayor tiene su bitácora.
- **Almacenamiento**: en Supabase (tablas de eventos o entradas de bitácora) para historial y posible uso por profesionales de salud en Chile.

### 3. Multi-familiar

- **Una cuenta / un grupo familiar**: varios usuarios (hermanos, hijos, cuidador externo) bajo el mismo “hogar” o familia.
- **Roles**: quien administra el grupo, quien solo cuida, quien solo consulta. Permisos por pantalla (medicación, bitácora, pánico, configuración).
- **Datos aislados por familia**: RLS en Supabase para que la familia A no vea datos de la familia B.
- **Interfaz**: selector de “paciente” o “tata” cuando hay más de uno; misma lógica que en la app React actual, con datos provenientes de Supabase.

### 4. Botón de pánico

- **Un botón visible** en la app que, al pulsarse, genera un “evento de emergencia” con hora y, si se desea, ubicación (opcional).
- **Notificación a la familia**: envío de alerta a los contactos del grupo (email, push o integración futura con WhatsApp/SMS). Implementación inicial puede ser “lista de contactos + email”; después se pueden sumar notificaciones push o servicios locales chilenos.
- **Registro en Supabase**: cada activación queda registrada para historial y seguimiento.

### 5. Otros módulos (soporte)

- **Prevención de caídas**: checklist de riesgos (iluminación, suelos, calzado), registro de incidentes (hora, lugar, tiempo en el suelo), alertas por factores de riesgo (sedantes, visión, cognición). Enfoque en entorno seguro en el hogar en Chile.
- **Integridad de piel (UPP)**: recordatorios de cambios posturales, registro de observación de piel (eritema, úlceras), fotos para seguimiento si se requiere. Criterios alineados con buenas prácticas, sin referir solo a normativa española.
- **Nutrición e hidratación**: metas de vasos de agua, recordatorios, registro de comidas en la bitácora. Opción de guías alimentarias para adultos mayores (Chile).
- **Polifarmacia**: hoja de medicación unificada, alertas de stock y caducidad, eliminación segura (referencia a puntos de entrega de medicamentos en Chile, si aplica).
- **Cuidado ético**: registro de restricciones (mecánicas o químicas) con justificación; advertencias ante uso de sedantes para “manejo conductual”; sugerencia de alternativas no farmacológicas. Enfoque en derechos y dignidad del adulto mayor en Chile.

---

## Despliegue en GitHub Pages (producción)

Para que el sitio funcione correctamente en producción en GitHub Pages:

### 1. Variables de entorno (Secrets en GitHub)

- En el repositorio: **Settings → Secrets and variables → Actions**.
- Añadir:
  - **VITE_SUPABASE_URL**: URL del proyecto Supabase (ej. `https://xxxxx.supabase.co`).
  - **VITE_SUPABASE_ANON_KEY**: clave anónima (anon key) de Supabase (Settings → API en el proyecto Supabase).

Sin estos secrets, el build usará valores placeholder y el login fallará en producción. Tras añadirlos, es necesario **volver a desplegar** (push a `main` o ejecutar el workflow de despliegue).

### 2. Configuración de GitHub Pages

- **Settings → Pages**.
- **Source**: GitHub Actions (no “Deploy from a branch”).
- Opcional: dominio personalizado (ej. `cuidoamitata.cl`) y HTTPS.

### 3. Workflow de despliegue

- El proyecto incluye un workflow (ej. `.github/workflows/deploy.yml`) que:
  - Instala dependencias, compila Tailwind, ejecuta build de Vite.
  - Genera `404.html` a partir de `app.html` para que las rutas del SPA (p. ej. `/app.html/medications`) funcionen al refrescar.
  - Sube el artefacto a GitHub Pages.

### 4. Comprobaciones antes de desplegar

- `npm run build` y `npm run preview` en local sin errores.
- En Supabase: tablas creadas (p. ej. `profiles`), RLS y políticas configuradas, al menos un usuario de prueba si se usa Auth.
- Documentación de referencia: [docs/despliegue-github-pages.md](despliegue-github-pages.md), [docs/lista-verificacion-produccion.md](lista-verificacion-produccion.md).

### 5. Después del despliegue

- Comprobar que la landing y la app (p. ej. `https://tu-dominio/app.html`) cargan.
- Probar login con Supabase; si aparece “Supabase no configurado”, revisar que los Secrets estén definidos y se haya vuelto a desplegar.

---

## Resumen para diseño e implementación

- **Identidad**: Chile; “Cuido a mi Tata”; español chileno; realidad familiar y sanitaria local.
- **Servicios centrales**: (1) Gestión de medicación, (2) Bitácora diaria, (3) Multi-familiar, (4) Botón de pánico.
- **Datos y backend**: Supabase para autenticación, usuarios, perfiles, familias y todos los datos de la app; la app React actual se integra con Supabase y se despliega en GitHub Pages.
- **Usuarios**: Registro y perfilamiento (roles, vinculación a familia) implementables con Supabase Auth y tablas en PostgreSQL.
- **Producción**: GitHub Pages con Secrets de Supabase, 404 para SPA y documentación en `docs/` para despliegue correcto.

Este documento sirve como base para el reporte de NotebookLM, el diseño de la experiencia y la implementación técnica de Cuido a mi Tata en Chile.
