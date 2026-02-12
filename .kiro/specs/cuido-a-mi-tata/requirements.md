# Documento de Requisitos - CuidoAMiTata

## Introducción

CuidoAMiTata es una aplicación líder en gestión de cuidados geriátricos que implementa prácticas basadas en evidencia siguiendo las directrices de la Sociedad Española de Geriatría y Gerontología (SEGG). El sistema proporciona herramientas integrales para cuidadores que gestionan la atención de adultos mayores, cubriendo adherencia a medicamentos, prevención de caídas, integridad de la piel, nutrición, hidratación, control de incontinencia, gestión de polifarmacia y cuidado ético.

## Glosario

- **Sistema**: La aplicación CuidoAMiTata
- **Cuidador**: Usuario que gestiona el cuidado de uno o más adultos mayores
- **Paciente**: Adulto mayor que recibe cuidados
- **Alerta_Dual**: Notificación que combina estímulos auditivos y visuales
- **Ventana_Adherencia**: Período de 3 horas para administración de medicamentos
- **UPP**: Úlcera por presión (grados I-IV)
- **SEGG**: Sociedad Española de Geriatría y Gerontología
- **SIGRE**: Sistema Integrado de Gestión y Recogida de Envases
- **Restricción_Química**: Uso de sedantes para manejo conductual
- **Restricción_Mecánica**: Dispositivos físicos que limitan movimiento
- **Telemonitorización**: Supervisión remota mediante fotografías y datos

## Requisitos

### Requisito 1: Sistema de Adherencia a Medicamentos

**Historia de Usuario:** Como cuidador, quiero recibir notificaciones oportunas para administrar medicamentos, para asegurar que el paciente reciba sus dosis en el momento correcto.

#### Criterios de Aceptación

1. CUANDO llega la hora programada de un medicamento, EL Sistema DEBERÁ emitir una Alerta_Dual
2. CUANDO se emite una alerta, EL Sistema DEBERÁ registrar la fecha y hora con marca temporal
3. CUANDO el cuidador confirma la administración, EL Sistema DEBERÁ validar que ocurra dentro de la Ventana_Adherencia
4. CUANDO se administra un medicamento, EL Sistema DEBERÁ registrar la confirmación con marca temporal
5. CUANDO se omite una dosis, EL Sistema DEBERÁ requerir justificación obligatoria antes de continuar


### Requisito 2: Prevención de Caídas y Seguridad Ambiental

**Historia de Usuario:** Como cuidador, quiero evaluar y gestionar riesgos de caídas diariamente, para prevenir incidentes y responder adecuadamente cuando ocurren.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ proporcionar una lista de verificación diaria de riesgos que incluya iluminación, suelos y calzado
2. CUANDO se completa la lista de verificación, EL Sistema DEBERÁ registrar la evaluación con marca temporal
3. CUANDO ocurre una caída, EL Sistema DEBERÁ permitir registro de incidente con campo obligatorio de "tiempo en el suelo"
4. CUANDO el paciente tiene sedantes prescritos, EL Sistema DEBERÁ mostrar alerta de riesgo elevado de caídas
5. CUANDO el paciente tiene deterioro cognitivo registrado, EL Sistema DEBERÁ mostrar alerta de riesgo elevado de caídas
6. CUANDO el paciente tiene problemas de visión registrados, EL Sistema DEBERÁ mostrar alerta de riesgo elevado de caídas

### Requisito 3: Gestión de Integridad de la Piel

**Historia de Usuario:** Como cuidador, quiero recibir recordatorios para cambios posturales y monitorear la piel del paciente, para prevenir úlceras por presión.

#### Criterios de Aceptación

1. DURANTE el día (06:00-22:00), EL Sistema DEBERÁ emitir notificaciones de cambio postural cada 2 horas
2. DURANTE la noche (22:00-06:00), EL Sistema DEBERÁ emitir notificaciones de cambio postural 3 veces
3. CUANDO se registra elevación de cama, EL Sistema DEBERÁ validar que no exceda 30 grados
4. CUANDO se detecta una UPP, EL Sistema DEBERÁ permitir clasificación por grado (I-IV)
5. CUANDO se registra una UPP, EL Sistema DEBERÁ permitir carga de fotografía para Telemonitorización
6. CUANDO se carga una fotografía, EL Sistema DEBERÁ registrar fecha y hora con marca temporal

### Requisito 4: Control de Nutrición e Hidratación

**Historia de Usuario:** Como cuidador, quiero gestionar la ingesta de alimentos y líquidos del paciente, para asegurar nutrición e hidratación adecuadas según directrices SEGG.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ emitir recordatorios de hidratación para alcanzar 6-8 vasos diarios
2. EL Sistema DEBERÁ proporcionar planificación dietética basada en SEGG que incluya pescado, aceite de oliva y yogur
3. EL Sistema DEBERÁ estructurar el plan de comidas en 5 ingestas diarias
4. CUANDO se registra ingesta de líquidos, EL Sistema DEBERÁ actualizar el contador diario de vasos
5. CUANDO se completa el registro de comida, EL Sistema DEBERÁ registrar tipo de alimento y hora con marca temporal


### Requisito 5: Control de Incontinencia

**Historia de Usuario:** Como cuidador, quiero programar y registrar visitas al baño del paciente, para mantener control de incontinencia y prevenir episodios.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ emitir recordatorios de visita al baño cada 2-3 horas
2. CUANDO se completa una visita al baño, EL Sistema DEBERÁ registrar la hora con marca temporal
3. CUANDO ocurre un episodio de incontinencia, EL Sistema DEBERÁ permitir registro con marca temporal
4. CUANDO se registran episodios, EL Sistema DEBERÁ mantener historial para análisis de patrones

### Requisito 6: Gestión de Polifarmacia

**Historia de Usuario:** Como cuidador, quiero mantener una hoja de medicamentos actualizada y accesible, para gestionar múltiples medicamentos de forma segura y responder a emergencias.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ mantener una hoja dinámica de medicamentos con nombre, dosis y propósito
2. CUANDO se solicita, EL Sistema DEBERÁ exportar la hoja de medicamentos en formato PDF
3. CUANDO el stock de un medicamento es bajo, EL Sistema DEBERÁ emitir notificación de reabastecimiento
4. CUANDO un medicamento está próximo a caducar, EL Sistema DEBERÁ emitir alerta de caducidad
5. EL Sistema DEBERÁ proporcionar mapa de puntos SIGRE para disposición de medicamentos
6. CUANDO se omite una dosis, EL Sistema DEBERÁ requerir justificación obligatoria antes de permitir otras acciones

### Requisito 7: Módulo de Cuidado Ético

**Historia de Usuario:** Como cuidador, quiero recibir orientación sobre prácticas de cuidado ético, para preservar la dignidad y libertad de movimiento del paciente evitando restricciones inapropiadas.

#### Criterios de Aceptación

1. CUANDO se intenta registrar sedantes para manejo conductual, EL Sistema DEBERÁ bloquear la acción y mostrar advertencia de Restricción_Química
2. CUANDO se registran barandillas laterales, EL Sistema DEBERÁ clasificarlas como Restricción_Mecánica
3. CUANDO se identifica una restricción, EL Sistema DEBERÁ mostrar panel de estrategias alternativas
4. EL Sistema DEBERÁ incluir en estrategias alternativas: técnicas de distracción, comunicación y modificación ambiental
5. CUANDO se registra cualquier restricción, EL Sistema DEBERÁ requerir justificación documentada


### Requisito 8: Interfaz de Usuario y Accesibilidad

**Historia de Usuario:** Como cuidador, quiero una interfaz clara y accesible en español, para usar la aplicación eficientemente en diferentes condiciones de iluminación.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ mostrar modo oscuro por defecto al iniciar
2. EL Sistema DEBERÁ proporcionar control de alternancia entre modo claro y oscuro
3. EL Sistema DEBERÁ mostrar todo el contenido y elementos de UI en español
4. EL Sistema DEBERÁ implementar diseño responsivo con prioridad móvil
5. CUANDO se cambia el modo de visualización, EL Sistema DEBERÁ persistir la preferencia del usuario

### Requisito 9: Registro y Auditoría de Datos

**Historia de Usuario:** Como cuidador, quiero que todas las acciones importantes queden registradas con marcas temporales, para mantener un historial preciso del cuidado proporcionado.

#### Criterios de Aceptación

1. CUANDO se registra cualquier evento de cuidado, EL Sistema DEBERÁ incluir marca temporal con fecha y hora
2. CUANDO se accede al historial, EL Sistema DEBERÁ mostrar eventos ordenados cronológicamente
3. CUANDO se exportan datos, EL Sistema DEBERÁ incluir todas las marcas temporales en el formato exportado
4. EL Sistema DEBERÁ mantener integridad de datos impidiendo modificación de registros históricos
5. CUANDO se visualizan registros, EL Sistema DEBERÁ permitir filtrado por tipo de evento y rango de fechas

### Requisito 10: Gestión de Múltiples Pacientes

**Historia de Usuario:** Como cuidador profesional, quiero gestionar múltiples pacientes desde una sola cuenta, para organizar eficientemente el cuidado de varias personas.

#### Criterios de Aceptación

1. EL Sistema DEBERÁ permitir creación de múltiples perfiles de paciente por cuenta de cuidador
2. CUANDO se selecciona un paciente, EL Sistema DEBERÁ mostrar solo datos y alertas relevantes a ese paciente
3. CUANDO hay alertas pendientes, EL Sistema DEBERÁ mostrar indicador visual por paciente
4. EL Sistema DEBERÁ permitir cambio rápido entre perfiles de paciente
5. CUANDO se emiten notificaciones, EL Sistema DEBERÁ identificar claramente a qué paciente corresponden


### Requisito 11: Notificaciones y Alertas

**Historia de Usuario:** Como cuidador, quiero recibir notificaciones claras y oportunas, para no perder eventos críticos de cuidado.

#### Criterios de Aceptación

1. CUANDO se programa una notificación, EL Sistema DEBERÁ emitirla en el momento exacto programado
2. CUANDO se emite una notificación crítica, EL Sistema DEBERÁ usar Alerta_Dual
3. CUANDO hay múltiples alertas pendientes, EL Sistema DEBERÁ priorizarlas por urgencia
4. EL Sistema DEBERÁ permitir configuración de preferencias de notificación por tipo de evento
5. CUANDO una notificación no es atendida en 15 minutos, EL Sistema DEBERÁ emitir recordatorio

### Requisito 12: Seguridad y Privacidad de Datos

**Historia de Usuario:** Como cuidador, quiero que los datos médicos del paciente estén protegidos, para cumplir con regulaciones de privacidad y mantener confidencialidad.

#### Criterios de Aceptación

1. CUANDO se accede a la aplicación, EL Sistema DEBERÁ requerir autenticación del usuario
2. CUANDO se transmiten datos, EL Sistema DEBERÁ usar cifrado en tránsito
3. CUANDO se almacenan datos sensibles, EL Sistema DEBERÁ usar cifrado en reposo
4. EL Sistema DEBERÁ implementar cierre de sesión automático después de 15 minutos de inactividad
5. CUANDO se exportan datos, EL Sistema DEBERÁ requerir confirmación adicional del usuario

### Requisito 13: Sincronización y Disponibilidad Offline

**Historia de Usuario:** Como cuidador, quiero acceder a información crítica incluso sin conexión a internet, para proporcionar cuidado continuo en cualquier circunstancia.

#### Criterios de Aceptación

1. CUANDO no hay conexión a internet, EL Sistema DEBERÁ permitir acceso a datos previamente sincronizados
2. CUANDO se registran eventos offline, EL Sistema DEBERÁ almacenarlos localmente
3. CUANDO se restablece la conexión, EL Sistema DEBERÁ sincronizar automáticamente eventos pendientes
4. CUANDO hay conflictos de sincronización, EL Sistema DEBERÁ priorizar el registro más reciente
5. EL Sistema DEBERÁ mostrar indicador visual del estado de conexión y sincronización

