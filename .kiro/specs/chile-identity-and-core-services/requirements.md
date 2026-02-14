# Documento de Requisitos

## Introducción

Este documento especifica los requisitos para implementar la identidad chilena y los cuatro servicios centrales de la aplicación CuidoAMiTata.cl. La aplicación está diseñada para el cuidado de adultos mayores en Chile, usando español chileno y alineada con el contexto sanitario chileno (SENAMA, Fonasa/Isapres, redes de apoyo familiar locales).

Los cuatro servicios centrales son:
1. Gestión de medicación con alarmas y confirmación visual
2. Bitácora diaria para comidas, ánimo y actividades
3. Soporte multi-familiar con roles y permisos
4. Botón de pánico para alertas de emergencia

## Glosario

- **Sistema**: La aplicación web CuidoAMiTata.cl
- **Página_Landing**: La página pública index.html para SEO y captación de usuarios
- **SPA**: Aplicación de Página Única (la app React accesible vía app.html)
- **Usuario**: Cualquier persona registrada usando la aplicación (cuidador, familiar, administrador)
- **Cuidador**: Un usuario con el rol de cuidador principal que registra actividades diarias
- **Familiar**: Un usuario con permisos de lectura o limitados dentro de un grupo familiar
- **Administrador**: Un usuario con permisos completos para gestionar miembros del grupo familiar y configuraciones
- **Paciente**: Un adulto mayor (tata/tata) siendo cuidado en el sistema
- **Grupo_Familiar**: Una colección de usuarios (cuidadores, familiares) cuidando uno o más pacientes
- **Bitácora**: Registro diario de actividades, comidas y ánimo del paciente
- **Supabase**: El servicio backend que provee autenticación y base de datos PostgreSQL
- **RLS**: Políticas de Seguridad a Nivel de Fila en PostgreSQL de Supabase
- **SENAMA**: Servicio Nacional del Adulto Mayor

## Requisitos

### Requisito 1: Identidad Chile en Página Landing

**Historia de Usuario:** Como usuario chileno visitando el sitio web, quiero ver contenido que refleje el contexto y lenguaje chileno, para sentir que la aplicación está diseñada para mi país y cultura.

#### Criterios de Aceptación

1. LA Página_Landing DEBERÁ mostrar contenido en dialecto español chileno
2. LA Página_Landing DEBERÁ referenciar el contexto sanitario chileno (SENAMA, realidad del cuidado familiar chileno)
3. LA Página_Landing NO DEBERÁ presentar a España u otros países como marco de referencia principal
4. CUANDO un usuario vea las meta etiquetas y títulos de página, LA Página_Landing DEBERÁ incluir palabras clave y descripciones específicas de Chile
5. LA Página_Landing DEBERÁ proveer enlaces claros de navegación al punto de entrada del SPA

### Requisito 2: Identidad Chile en Interfaz de Aplicación

**Historia de Usuario:** Como usuario chileno navegando la aplicación, quiero todo el texto de interfaz en español chileno, para que la experiencia se sienta natural y localmente relevante.

#### Criterios de Aceptación

1. EL SPA DEBERÁ mostrar todo el texto visible al usuario en español chileno
2. EL SPA DEBERÁ usar formatos de fecha y hora chilenos
3. EL SPA DEBERÁ usar términos chilenos apropiados para el cuidado (tata, cuidador, etc.)
4. CUANDO se muestren navegación y títulos de pantalla, EL SPA DEBERÁ usar terminología en español chileno
5. EL SPA NO DEBERÁ incluir terminología específica de España como opción de lenguaje principal

### Requisito 3: Modelo de Datos de Bitácora Diaria

**Historia de Usuario:** Como cuidador, quiero registrar actividades diarias de mi paciente, para poder rastrear su bienestar a lo largo del tiempo.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ almacenar entradas de bitácora en Supabase con asociación al paciente
2. CUANDO se crea una entrada de bitácora, EL Sistema DEBERÁ registrar la fecha, hora, ID del paciente e ID del cuidador
3. EL Sistema DEBERÁ soportar el registro de información de comidas (desayuno, almuerzo, cena, colaciones)
4. EL Sistema DEBERÁ soportar el registro de información de ánimo (bien, regular, bajo, irritable, o etiquetas personalizadas)
5. EL Sistema DEBERÁ soportar el registro de información de actividades (paseo, visitas, terapia, reposo, etc.)
6. EL Sistema DEBERÁ aplicar políticas RLS para que los usuarios solo accedan a entradas de bitácora de su Grupo_Familiar

### Requisito 4: Interfaz de Usuario de Bitácora Diaria

**Historia de Usuario:** Como cuidador, quiero una interfaz intuitiva para registrar actividades diarias, para poder registrar información rápidamente sin complejidad.

#### Criterios de Aceptación

1. CUANDO un Cuidador accede a la pantalla de bitácora, EL Sistema DEBERÁ mostrar un formulario para la fecha actual
2. EL Sistema DEBERÁ proveer campos de entrada para comidas, ánimo y actividades
3. CUANDO un Cuidador envía una entrada de bitácora, EL Sistema DEBERÁ persistirla en Supabase inmediatamente
4. CUANDO un Cuidador ve entradas históricas, EL Sistema DEBERÁ mostrar entradas organizadas por fecha y paciente
5. EL Sistema DEBERÁ permitir edición de entradas de bitácora creadas por el mismo usuario dentro de 24 horas

### Requisito 5: Modelo de Datos Multi-Familiar

**Historia de Usuario:** Como administrador familiar, quiero gestionar múltiples miembros de familia bajo una cuenta, para que todos puedan colaborar en el cuidado.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ almacenar grupos familiares en una tabla de Supabase con identificadores únicos
2. EL Sistema DEBERÁ almacenar asociaciones de membresía familiar vinculando usuarios a Grupos_Familiares
3. EL Sistema DEBERÁ asignar roles a usuarios (administrador, cuidador, familiar) dentro de cada Grupo_Familiar
4. EL Sistema DEBERÁ aplicar políticas RLS aislando datos por Grupo_Familiar
5. CUANDO un usuario pertenece a múltiples Grupos_Familiares, EL Sistema DEBERÁ mantener contextos de datos separados para cada grupo

### Requisito 6: Gestión de Usuarios Multi-Familiar

**Historia de Usuario:** Como administrador familiar, quiero invitar y gestionar miembros de familia, para poder controlar quién tiene acceso a la información del paciente.

#### Criterios de Aceptación

1. CUANDO un Administrador invita a un nuevo miembro, EL Sistema DEBERÁ enviar una invitación vía email
2. EL Sistema DEBERÁ permitir a Administradores asignar roles a miembros de familia
3. EL Sistema DEBERÁ permitir a Administradores remover miembros del Grupo_Familiar
4. CUANDO un Usuario acepta una invitación, EL Sistema DEBERÁ agregarlo al Grupo_Familiar con el rol asignado
5. EL Sistema DEBERÁ mostrar una lista de miembros familiares actuales con sus roles a los Administradores

### Requisito 7: Cambio de Contexto Multi-Familiar

**Historia de Usuario:** Como usuario perteneciente a múltiples familias, quiero cambiar entre contextos familiares, para poder gestionar diferentes pacientes por separado.

#### Criterios de Aceptación

1. CUANDO un Usuario pertenece a múltiples Grupos_Familiares, EL Sistema DEBERÁ mostrar un selector de familia
2. CUANDO un Usuario selecciona un Grupo_Familiar, EL Sistema DEBERÁ cargar datos solo para ese grupo
3. EL Sistema DEBERÁ persistir el Grupo_Familiar seleccionado a través de sesiones
4. EL Sistema DEBERÁ mostrar el nombre del Grupo_Familiar actual en la interfaz de navegación
5. CUANDO se cambia de Grupo_Familiar, EL Sistema DEBERÁ recargar datos relevantes sin requerir cierre de sesión

### Requisito 8: Interfaz de Botón de Pánico

**Historia de Usuario:** Como cuidador, quiero un botón de pánico visible, para poder alertar rápidamente a los miembros de familia en una emergencia.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ mostrar un componente de botón de pánico en pantallas relevantes
2. EL botón de pánico DEBERÁ ser visualmente prominente y fácilmente accesible
3. CUANDO un Usuario activa el botón de pánico, EL Sistema DEBERÁ mostrar un diálogo de confirmación
4. CUANDO se confirma, EL Sistema DEBERÁ registrar un evento de emergencia en Supabase con marca de tiempo
5. EL Sistema DEBERÁ proveer retroalimentación visual de que la alerta fue enviada exitosamente

### Requisito 9: Notificaciones de Botón de Pánico

**Historia de Usuario:** Como miembro de familia, quiero recibir notificación inmediata cuando se presiona el botón de pánico, para poder responder a emergencias rápidamente.

#### Criterios de Aceptación

1. CUANDO se registra un evento de emergencia, EL Sistema DEBERÁ recuperar todos los emails de contacto del Grupo_Familiar
2. EL Sistema DEBERÁ enviar notificaciones por email a todos los miembros de familia
3. LA notificación por email DEBERÁ incluir la marca de tiempo, nombre del paciente y cuidador que activó la alerta
4. EL Sistema DEBERÁ registrar el estado de entrega de notificaciones en Supabase
5. SI la entrega de email falla, EL Sistema DEBERÁ reintentar la entrega de notificación hasta tres veces

### Requisito 10: Autenticación y Perfiles en Supabase

**Historia de Usuario:** Como nuevo usuario, quiero registrarme y crear un perfil, para poder acceder a la aplicación y unirme a un grupo familiar.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ usar Supabase Auth para registro de usuario con email y contraseña
2. CUANDO un Usuario se registra, EL Sistema DEBERÁ crear un registro de perfil en la tabla profiles
3. LA tabla profiles DEBERÁ almacenar nombre de usuario, email, teléfono (opcional) y rol predeterminado
4. EL Sistema DEBERÁ soportar recuperación de contraseña vía Supabase Auth
5. EL Sistema DEBERÁ mantener el estado de sesión del usuario a través de refrescos de página

### Requisito 11: Tablas de Datos y RLS en Supabase

**Historia de Usuario:** Como administrador del sistema, quiero tablas de base de datos correctamente configuradas con políticas de seguridad, para que los datos de usuario estén protegidos y aislados por grupo familiar.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ incluir tablas para profiles, families, family_members, patients, bitacora_entries y panic_events
2. EL Sistema DEBERÁ configurar políticas RLS en todas las tablas para aplicar aislamiento por Grupo_Familiar
3. CUANDO un Usuario consulta datos, EL Sistema DEBERÁ retornar solo registros asociados con su(s) Grupo_Familiar(es)
4. EL Sistema DEBERÁ documentar todos los esquemas de tablas y políticas RLS en el repositorio
5. EL Sistema DEBERÁ proveer scripts de migración SQL para crear tablas y políticas

### Requisito 12: Enrutamiento y Navegación de Aplicación

**Historia de Usuario:** Como usuario, quiero navegación clara a todos los servicios centrales, para poder acceder fácilmente a medicación, bitácora, gestión familiar y funciones de pánico.

#### Criterios de Aceptación

1. EL SPA DEBERÁ incluir rutas para gestión de medicación, bitácora, gestión familiar y botón de pánico
2. EL SPA DEBERÁ mostrar un menú de navegación con enlaces a todos los servicios centrales
3. EL SPA DEBERÁ usar configuración de basename correcta para despliegue en GitHub Pages
4. CUANDO un Usuario refresca una ruta, EL Sistema DEBERÁ servir la página correcta vía fallback 404.html
5. EL SPA DEBERÁ resaltar la ruta activa en el menú de navegación

### Requisito 13: Configuración de Despliegue en GitHub Pages

**Historia de Usuario:** Como desarrollador, quiero que la aplicación se despliegue correctamente en GitHub Pages, para que los usuarios puedan acceder al sitio de producción de manera confiable.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ usar GitHub Secrets para VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
2. EL flujo de despliegue DEBERÁ construir la aplicación con Vite
3. EL flujo de despliegue DEBERÁ generar 404.html desde app.html para enrutamiento SPA
4. EL flujo de despliegue DEBERÁ subir el artefacto de construcción a GitHub Pages
5. CUANDO el despliegue se completa, EL Sistema DEBERÁ ser accesible en el dominio configurado con autenticación funcionando

### Requisito 14: Integración de Gestión de Medicación

**Historia de Usuario:** Como cuidador, quiero que las funciones existentes de gestión de medicación funcionen sin problemas con la identidad Chile y contexto multi-familiar, para poder gestionar medicamentos de mis pacientes.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ mantener las pantallas y funcionalidad existentes de gestión de medicación
2. LA interfaz de gestión de medicación DEBERÁ mostrar texto en español chileno
3. CUANDO un Usuario accede a funciones de medicación, EL Sistema DEBERÁ filtrar datos por Grupo_Familiar actual
4. EL Sistema DEBERÁ soportar alarmas de medicación y confirmación visual como se implementó previamente
5. EL Sistema DEBERÁ permitir exportación de hojas de medicación a PDF con formato chileno

### Requisito 15: Adaptación de Módulos de Soporte Existentes

**Historia de Usuario:** Como usuario, quiero que los módulos de soporte existentes (caídas, piel, nutrición, polifarmacia, cuidado ético) reflejen el contexto chileno, para que todas las funciones sean culturalmente apropiadas.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ actualizar todo el texto de módulos de soporte a español chileno
2. EL Sistema DEBERÁ referenciar guías de salud chilenas donde sea aplicable
3. EL Sistema DEBERÁ mantener la funcionalidad existente de módulos de soporte
4. CUANDO se muestre contenido de módulos de soporte, EL Sistema DEBERÁ usar terminología chilena
5. EL Sistema NO DEBERÁ referenciar regulaciones específicas de España como guía principal
