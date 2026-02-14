# Guía de Usuario - CuidoAMiTata

## Bienvenido a CuidoAMiTata

CuidoAMiTata es una aplicación diseñada para ayudarle a gestionar el cuidado de adultos mayores de manera profesional y basada en evidencia científica. Esta guía le enseñará a usar todas las funcionalidades de la aplicación.

## Tabla de Contenidos

1. [Primeros Pasos](#primeros-pasos)
2. [Gestión de Pacientes](#gestión-de-pacientes)
3. [Medicamentos](#medicamentos)
4. [Prevención de Caídas](#prevención-de-caídas)
5. [Integridad de Piel](#integridad-de-piel)
6. [Nutrición e Hidratación](#nutrición-e-hidratación)
7. [Control de Incontinencia](#control-de-incontinencia)
8. [Polifarmacia](#polifarmacia)
9. [Cuidado Ético](#cuidado-ético)
10. [Historial y Reportes](#historial-y-reportes)
11. [Configuración](#configuración)
12. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Primeros Pasos

### Instalación

1. **Acceder a la aplicación**:
   - Web: Visite https://cuidoamitata.cl
   - Móvil: Descargue desde App Store o Google Play (próximamente)

2. **Crear una cuenta**:
   - Haga clic en "Registrarse"
   - Ingrese su correo electrónico y contraseña
   - Confirme su correo electrónico

3. **Iniciar sesión**:
   - Ingrese sus credenciales
   - La sesión se cerrará automáticamente después de 15 minutos de inactividad por seguridad

### Interfaz Principal

La aplicación tiene tres áreas principales:

1. **Barra Superior**:
   - Logo de CuidoAMiTata
   - Selector de paciente
   - Notificaciones pendientes
   - Botón de tema (claro/oscuro)
   - Menú de usuario

2. **Menú Lateral** (o inferior en móvil):
   - Inicio
   - Medicamentos
   - Prevención de Caídas
   - Integridad de Piel
   - Nutrición
   - Incontinencia
   - Polifarmacia
   - Cuidado Ético
   - Historial
   - Configuración

3. **Área de Contenido**:
   - Contenido de la sección seleccionada
   - Formularios y listas
   - Alertas y notificaciones

### Modo Oscuro

La aplicación inicia en modo oscuro por defecto, ideal para uso nocturno:

- **Cambiar tema**: Haga clic en el icono de sol/luna en la barra superior
- **Persistencia**: Su preferencia se guarda automáticamente

---

## Gestión de Pacientes

### Crear un Paciente

1. Vaya a **Inicio** → **Agregar Paciente**
2. Complete el formulario:
   - Nombre completo
   - Fecha de nacimiento
   - Factores de riesgo (sedantes, deterioro cognitivo, problemas de visión)
   - Notas adicionales
3. Haga clic en **Guardar**

### Seleccionar un Paciente

- Use el **selector de paciente** en la barra superior
- Todos los datos y alertas se filtrarán automáticamente para el paciente seleccionado

### Cambiar entre Pacientes

- Haga clic en el selector de paciente
- Seleccione el paciente deseado de la lista
- Los indicadores visuales muestran si hay alertas pendientes

### Editar un Paciente

1. Vaya a **Inicio** → **Lista de Pacientes**
2. Haga clic en el paciente que desea editar
3. Modifique los campos necesarios
4. Haga clic en **Guardar Cambios**

---

## Medicamentos

### Programar un Medicamento

1. Vaya a **Medicamentos** → **Agregar Medicamento**
2. Complete la información:
   - Nombre del medicamento
   - Dosis (ej: "100mg")
   - Propósito (ej: "Anticoagulante")
   - Horarios (puede agregar múltiples)
   - Stock inicial
   - Fecha de caducidad
3. Haga clic en **Programar**

**Ejemplo**:
```
Nombre: Aspirina
Dosis: 100mg
Propósito: Prevención cardiovascular
Horarios: 08:00, 20:00
Stock: 60 tabletas
Caducidad: 31/12/2027
```

### Recibir Alertas de Medicación

Cuando llega la hora de un medicamento:

1. **Alerta Dual**:
   - Sonido de notificación
   - Vibración (en móvil)
   - Notificación visual en pantalla

2. **Información mostrada**:
   - Nombre del medicamento
   - Dosis a administrar
   - Propósito
   - Hora programada

3. **Acciones disponibles**:
   - Confirmar administración
   - Omitir dosis (requiere justificación)
   - Posponer 15 minutos

### Confirmar Administración

1. Cuando reciba la alerta, haga clic en **Confirmar**
2. La aplicación valida que esté dentro de la **ventana de adherencia** (±1.5 horas)
3. Si está fuera de la ventana, recibirá una advertencia
4. La confirmación se registra con marca temporal

### Omitir una Dosis

1. Haga clic en **Omitir Dosis**
2. **Debe proporcionar una justificación** (mínimo 10 caracteres):
   - "Paciente rechazó medicamento"
   - "Náuseas después del desayuno"
   - "Indicación médica de suspender temporalmente"
3. Haga clic en **Confirmar Omisión**

⚠️ **Importante**: No puede omitir una dosis sin justificación. Esto es un requisito de seguridad.

### Ver Hoja de Medicamentos

1. Vaya a **Medicamentos** → **Hoja de Medicamentos**
2. Verá todos los medicamentos activos con:
   - Nombre y dosis
   - Horarios programados
   - Próxima dosis
   - Stock restante
   - Días hasta caducidad

---

## Prevención de Caídas

### Lista de Verificación Diaria

Realice esta verificación cada mañana:

1. Vaya a **Prevención de Caídas** → **Lista de Verificación**
2. Evalúe cada aspecto:
   - **Iluminación**: ¿Es adecuada? ¿Hay suficiente luz?
   - **Suelos**: ¿Están secos? ¿Sin obstáculos?
   - **Calzado**: ¿Es apropiado? ¿Antideslizante?
3. Agregue notas si es necesario
4. Haga clic en **Guardar Evaluación**

### Registrar un Incidente de Caída

Si ocurre una caída:

1. Vaya a **Prevención de Caídas** → **Registrar Incidente**
2. Complete la información:
   - Fecha y hora del incidente
   - **Tiempo en el suelo** (obligatorio, en minutos)
   - Ubicación (ej: "Baño", "Dormitorio")
   - Circunstancias (ej: "Al levantarse de la cama")
   - Lesiones (si las hay)
3. Haga clic en **Registrar**

⚠️ **Campo Obligatorio**: El tiempo en el suelo es crítico para evaluar la gravedad del incidente.

### Alertas de Riesgo

La aplicación muestra alertas automáticas si el paciente tiene:

- 🔴 **Sedantes prescritos**: Riesgo elevado de caídas
- 🔴 **Deterioro cognitivo**: Mayor riesgo de desorientación
- 🔴 **Problemas de visión**: Dificultad para ver obstáculos

Estas alertas se muestran en el panel de prevención de caídas y en el perfil del paciente.

---

## Integridad de Piel

### Cambios Posturales

La aplicación programa automáticamente cambios posturales:

**Durante el día (06:00 - 22:00)**:
- Cada 2 horas
- 8 notificaciones totales

**Durante la noche (22:00 - 06:00)**:
- 3 notificaciones espaciadas

### Registrar un Cambio Postural

1. Cuando reciba la notificación, vaya a **Integridad de Piel**
2. Haga clic en **Registrar Cambio**
3. Seleccione la posición:
   - Supino (boca arriba)
   - Lateral izquierdo
   - Lateral derecho
   - Prono (boca abajo)
   - Sentado
4. Agregue notas si es necesario
5. Haga clic en **Guardar**

### Registrar Elevación de Cama

1. Vaya a **Integridad de Piel** → **Elevación de Cama**
2. Ingrese los grados de elevación
3. La aplicación valida que **no exceda 30 grados**
4. Si excede, recibirá una advertencia
5. Haga clic en **Registrar**

⚠️ **Límite de Seguridad**: La elevación máxima es 30 grados para prevenir úlceras por presión.

### Registrar Úlcera por Presión (UPP)

Si detecta una úlcera:

1. Vaya a **Integridad de Piel** → **Registrar UPP**
2. Complete la información:
   - **Grado** (I, II, III, IV)
   - Ubicación (ej: "Sacro", "Talón derecho")
   - Tamaño (largo x ancho x profundidad en cm)
   - Tratamiento aplicado
3. **Tome una fotografía**:
   - Haga clic en **Agregar Foto**
   - Tome o seleccione una foto
   - La foto se guarda con marca temporal para telemonitorización
4. Haga clic en **Guardar**

**Clasificación de UPP**:
- **Grado I**: Enrojecimiento que no palidece
- **Grado II**: Pérdida parcial de piel
- **Grado III**: Pérdida total de piel
- **Grado IV**: Pérdida total de tejido

---

## Nutrición e Hidratación

### Plan de Comidas SEGG

La aplicación genera automáticamente un plan basado en las directrices de la Sociedad Española de Geriatría y Gerontología:

1. Vaya a **Nutrición** → **Plan de Comidas**
2. Verá 5 comidas diarias:
   - Desayuno (08:00)
   - Media mañana (11:00)
   - Almuerzo (14:00)
   - Merienda (17:00)
   - Cena (20:00)
3. Cada comida incluye recomendaciones:
   - Pescado (2-3 veces por semana)
   - Aceite de oliva
   - Yogur
   - Frutas y verduras

### Registrar Ingesta de Comida

1. Cuando el paciente coma, vaya a **Nutrición**
2. Seleccione el tipo de comida
3. Marque los alimentos consumidos
4. Agregue notas sobre la cantidad
5. Haga clic en **Registrar**

### Hidratación

**Objetivo**: 6-8 vasos de agua al día

1. **Contador de Hidratación**:
   - Se muestra en la pantalla de Nutrición
   - Actualizado en tiempo real
   - Muestra progreso hacia el objetivo

2. **Registrar Ingesta de Líquidos**:
   - Haga clic en **+ Vasos**
   - Ingrese la cantidad (ej: 1, 2 vasos)
   - El contador se actualiza automáticamente

3. **Recordatorios**:
   - Recibirá recordatorios periódicos
   - Frecuencia ajustable en Configuración

---

## Control de Incontinencia

### Programar Recordatorios de Baño

1. Vaya a **Incontinencia** → **Configurar Recordatorios**
2. Seleccione el intervalo (2-3 horas recomendado)
3. Haga clic en **Guardar**
4. Recibirá notificaciones en los horarios programados

### Registrar Visita al Baño

1. Cuando el paciente visite el baño, vaya a **Incontinencia**
2. Haga clic en **Registrar Visita**
3. Marque si fue exitosa
4. Agregue notas si es necesario
5. Haga clic en **Guardar**

### Registrar Episodio de Incontinencia

Si ocurre un episodio:

1. Vaya a **Incontinencia** → **Registrar Episodio**
2. Complete la información:
   - Fecha y hora
   - Severidad (Menor, Moderada, Mayor)
   - Notas sobre las circunstancias
3. Haga clic en **Registrar**

### Análisis de Patrones

1. Vaya a **Incontinencia** → **Análisis de Patrones**
2. Seleccione un rango de fechas
3. Verá:
   - Total de episodios
   - Promedio por día
   - Horas pico
   - Tendencia (Mejorando, Estable, Empeorando)
4. Use esta información para ajustar los recordatorios

---

## Polifarmacia

### Hoja Dinámica de Medicamentos

La hoja de medicamentos se actualiza automáticamente:

1. Vaya a **Polifarmacia** → **Hoja de Medicamentos**
2. Verá todos los medicamentos con:
   - Nombre comercial y genérico
   - Dosis y frecuencia
   - Propósito
   - Stock actual
   - Fecha de caducidad
   - Próxima dosis

### Exportar a PDF

Para llevar a consultas médicas o emergencias:

1. Vaya a **Polifarmacia** → **Hoja de Medicamentos**
2. Haga clic en **Exportar a PDF**
3. El PDF incluye:
   - Todos los medicamentos activos
   - Información completa de cada uno
   - Fecha de generación
   - Datos del paciente
4. Guarde o imprima el PDF

### Alertas de Stock Bajo

Cuando un medicamento tiene poco stock:

1. Recibirá una notificación
2. La alerta muestra:
   - Medicamento afectado
   - Stock restante
   - Días estimados hasta agotarse
3. Haga clic en **Reabastecer** para marcar como gestionado

### Alertas de Caducidad

Cuando un medicamento está próximo a caducar:

1. Recibirá una notificación (30 días antes)
2. La alerta muestra:
   - Medicamento afectado
   - Fecha de caducidad
   - Días restantes
3. Opciones:
   - Marcar como reemplazado
   - Ver puntos SIGRE para disposición

### Puntos SIGRE

Para desechar medicamentos caducados de forma segura:

1. Vaya a **Polifarmacia** → **Puntos SIGRE**
2. Verá un mapa con puntos cercanos
3. Información de cada punto:
   - Dirección
   - Distancia
   - Horario de atención
4. Haga clic en un punto para obtener direcciones

---

## Cuidado Ético

### Restricciones Químicas

La aplicación **bloquea** el uso de sedantes para manejo conductual:

1. Si intenta registrar un sedante con propósito de "manejo conductual"
2. Recibirá un mensaje de bloqueo:
   - "No se pueden usar sedantes para manejo conductual"
   - "Consulte las estrategias alternativas"
3. El registro no se permite

✅ **Permitido**: Sedantes con indicación médica válida (ej: ansiedad diagnosticada)

### Restricciones Mecánicas

Si necesita usar barandillas u otras restricciones:

1. Vaya a **Cuidado Ético** → **Registrar Restricción**
2. La aplicación clasifica automáticamente:
   - Barandillas → Restricción Mecánica
   - Sujeciones → Restricción Mecánica
   - Puertas cerradas → Restricción Ambiental
3. **Debe proporcionar justificación documentada**
4. Se muestra panel de estrategias alternativas

### Estrategias Alternativas

Antes de usar restricciones, considere:

**Técnicas de Distracción**:
- Música favorita
- Actividades manuales
- Conversación
- Paseos

**Comunicación Efectiva**:
- Tono calmado
- Frases cortas y claras
- Validación de emociones
- Contacto visual

**Modificación Ambiental**:
- Iluminación adecuada
- Reducir ruidos
- Temperatura confortable
- Objetos familiares

### Justificación Documentada

Para cualquier restricción:

1. Complete el formulario de justificación:
   - Razón médica específica
   - Alternativas consideradas
   - Duración estimada
   - Plan de revisión
2. La justificación se registra en el historial
3. No se puede proceder sin justificación completa

---

## Historial y Reportes

### Ver Historial

1. Vaya a **Historial**
2. Verá todos los eventos ordenados cronológicamente:
   - Más recientes primero (por defecto)
   - Cada evento muestra:
     - Tipo de evento
     - Fecha y hora exacta
     - Detalles
     - Usuario responsable

### Filtrar Historial

**Por Tipo de Evento**:
1. Haga clic en **Filtros**
2. Seleccione uno o más tipos:
   - Medicación
   - Caídas
   - Cambios posturales
   - Nutrición
   - Incontinencia
   - Restricciones
3. Haga clic en **Aplicar**

**Por Rango de Fechas**:
1. Haga clic en **Filtros**
2. Seleccione fecha de inicio y fin
3. Haga clic en **Aplicar**

### Exportar Historial

1. Vaya a **Historial** → **Exportar**
2. Seleccione el formato:
   - PDF (para imprimir)
   - CSV (para Excel)
   - JSON (para análisis)
3. Seleccione rango de fechas
4. Haga clic en **Exportar**
5. **Confirme la exportación** (requisito de seguridad)
6. El archivo incluye todas las marcas temporales

### Inmutabilidad de Registros

⚠️ **Importante**: Los registros históricos (más de 24 horas) no se pueden modificar ni eliminar. Esto garantiza la integridad de la auditoría.

---

## Configuración

### Preferencias de Usuario

1. Vaya a **Configuración** → **Preferencias**
2. Ajuste:
   - Tema (Claro/Oscuro)
   - Idioma (Español)
   - Formato de fecha y hora
   - Zona horaria

### Notificaciones

1. Vaya a **Configuración** → **Notificaciones**
2. Configure:
   - **Sonido**: Activar/Desactivar
   - **Vibración**: Activar/Desactivar (móvil)
   - **Notificaciones Push**: Activar/Desactivar
   - **Horas de Silencio**: Definir rango (ej: 23:00 - 07:00)
   - **Filtro de Prioridad**: Todas, Solo Altas, Solo Críticas

### Seguridad

1. Vaya a **Configuración** → **Seguridad**
2. Opciones:
   - **Cambiar Contraseña**
   - **Auto-Logout**: Ajustar tiempo de inactividad (por defecto 15 min)
   - **Autenticación de Dos Factores**: Activar/Desactivar
   - **Sesiones Activas**: Ver y cerrar sesiones

### Sincronización

1. Vaya a **Configuración** → **Sincronización**
2. Información:
   - Estado de conexión (Online/Offline)
   - Última sincronización
   - Eventos pendientes
   - Conflictos (si los hay)
3. Acciones:
   - **Sincronizar Ahora**: Forzar sincronización
   - **Modo Offline**: Activar manualmente
   - **Resolver Conflictos**: Ver y resolver

---

## Preguntas Frecuentes

### General

**P: ¿Puedo usar la aplicación sin conexión a internet?**
R: Sí, la aplicación funciona completamente offline. Los datos se guardan localmente y se sincronizan automáticamente cuando se restablece la conexión.

**P: ¿Cuántos pacientes puedo gestionar?**
R: No hay límite. Puede crear y gestionar múltiples perfiles de pacientes desde una sola cuenta.

**P: ¿Mis datos están seguros?**
R: Sí, todos los datos sensibles se cifran con AES-256 antes de almacenarse. Las comunicaciones usan TLS 1.3.

### Medicamentos

**P: ¿Qué es la ventana de adherencia?**
R: Es un período de ±1.5 horas (3 horas total) alrededor de la hora programada. Administrar dentro de esta ventana se considera adherente.

**P: ¿Puedo omitir una dosis sin justificación?**
R: No, la justificación es obligatoria por seguridad. Debe proporcionar al menos 10 caracteres explicando la razón.

**P: ¿Cómo cambio el horario de un medicamento?**
R: Vaya a Medicamentos → Hoja de Medicamentos → Seleccione el medicamento → Editar → Modifique horarios → Guardar.

### Notificaciones

**P: ¿Qué es una alerta dual?**
R: Es una notificación que combina sonido/vibración con alerta visual para eventos críticos como medicamentos.

**P: ¿Puedo silenciar las notificaciones por la noche?**
R: Sí, configure "Horas de Silencio" en Configuración → Notificaciones. Las notificaciones críticas seguirán sonando.

**P: ¿Qué pasa si no atiendo una notificación?**
R: Después de 15 minutos, recibirá un recordatorio automático.

### Sincronización

**P: ¿Qué pasa si registro eventos offline?**
R: Se guardan localmente y se sincronizan automáticamente cuando se reconecta.

**P: ¿Cómo se resuelven los conflictos?**
R: El sistema prioriza el registro con timestamp más reciente. Puede revisar conflictos en Configuración → Sincronización.

**P: ¿Puedo perder datos si estoy offline?**
R: No, todos los datos se guardan localmente de forma segura.

### Seguridad

**P: ¿Por qué se cierra mi sesión automáticamente?**
R: Por seguridad, la sesión se cierra después de 15 minutos de inactividad. Puede ajustar este tiempo en Configuración.

**P: ¿Puedo compartir mi cuenta con otros cuidadores?**
R: No se recomienda. Es mejor crear cuentas individuales y asignar los mismos pacientes a múltiples cuidadores.

**P: ¿Qué hago si olvido mi contraseña?**
R: Haga clic en "¿Olvidó su contraseña?" en la pantalla de inicio de sesión y siga las instrucciones.

### Historial

**P: ¿Puedo modificar un registro antiguo?**
R: No, los registros de más de 24 horas son inmutables para garantizar la integridad de la auditoría.

**P: ¿Puedo eliminar eventos del historial?**
R: No, todos los eventos se mantienen para auditoría. Puede filtrar la vista pero no eliminar registros.

**P: ¿Cómo exporto datos para mi médico?**
R: Use Polifarmacia → Exportar PDF para medicamentos, o Historial → Exportar para eventos completos.

---

## Soporte Técnico

### Contacto

- **Email**: cuidoamitata@gmail.com
- **WhatsApp**: +56 9 8762 9765
- **Horario**: Lunes a Viernes, 9:00 - 18:00 (Chile)

### Reportar un Problema

1. Vaya a **Configuración** → **Ayuda** → **Reportar Problema**
2. Describa el problema detalladamente
3. Incluya capturas de pantalla si es posible
4. Haga clic en **Enviar**

### Recursos Adicionales

- **Tutoriales en Video**: https://cuidoamitata.cl/tutoriales
- **Blog**: https://cuidoamitata.cl/blog
- **Comunidad**: https://facebook.com/CuidoAMiTata

---

## Glosario

- **Adherencia**: Cumplimiento del horario de medicación
- **Alerta Dual**: Notificación audio + visual
- **SEGG**: Sociedad Española de Geriatría y Gerontología
- **SIGRE**: Sistema de disposición de medicamentos
- **UPP**: Úlcera por presión
- **Ventana de Adherencia**: Período de ±1.5 horas para medicación
- **Restricción Química**: Uso de sedantes para manejo conductual
- **Restricción Mecánica**: Dispositivos físicos que limitan movimiento
- **Telemonitorización**: Supervisión remota con fotografías

---

**Última actualización**: 2026-02-13
**Versión**: 1.0.0

¡Gracias por usar CuidoAMiTata! Estamos comprometidos con mejorar el cuidado de adultos mayores.

[Volver al índice](README.md)
