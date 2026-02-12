# Plan de Implementación: CuidoAMiTata

## Visión General

Este plan implementa una aplicación de gestión de cuidados geriátricos basada en evidencia siguiendo directrices SEGG. La implementación se estructura en módulos incrementales, comenzando con la infraestructura base y servicios fundamentales, luego construyendo los módulos de cuidado específicos, y finalmente integrando todo con la interfaz de usuario.

El enfoque prioriza:
1. Servicios fundamentales (almacenamiento, validación, notificaciones)
2. Módulos de cuidado core (medicación, prevención de caídas)
3. Módulos de cuidado adicionales (piel, nutrición, incontinencia)
4. Gestión avanzada (polifarmacia, cuidado ético)
5. Sincronización y características offline
6. Interfaz de usuario y experiencia completa

## Tareas

- [ ] 1. Configurar estructura del proyecto y servicios fundamentales
  - Crear estructura de directorios TypeScript
  - Configurar TypeScript, ESLint, Prettier
  - Instalar dependencias: React Native/React, Redux, fast-check para pruebas
  - Configurar IndexedDB wrapper y LocalStorage utilities
  - Definir tipos base y enums (ErrorCode, Priority, etc.)
  - _Requisitos: 8.3, 9.1_

- [ ] 2. Implementar Storage Service con cifrado
  - [ ] 2.1 Crear StorageService con métodos de cifrado AES-256
    - Implementar saveEncrypted, loadEncrypted
    - Implementar savePreference, loadPreference
    - Implementar clearPatientData
    - _Requisitos: 12.3_
  
  - [ ]* 2.2 Escribir prueba de propiedad para cifrado de datos sensibles
    - **Propiedad 32: Cifrado de datos sensibles**
    - **Valida: Requisitos 12.3**

- [ ] 3. Implementar Validation Service
  - [ ] 3.1 Crear ValidationService con validaciones core
    - Implementar validateAdherenceWindow (ventana de 3 horas)
    - Implementar validateBedElevation (máx 30 grados)
    - Implementar validateRequiredField
    - Implementar validateDateRange
    - _Requisitos: 1.3, 3.3_
  
  - [ ]* 3.2 Escribir prueba de propiedad para ventana de adherencia
    - **Propiedad 3: Validación de ventana de adherencia**
    - **Valida: Requisitos 1.3**
  
  - [ ]* 3.3 Escribir prueba de propiedad para elevación de cama
    - **Propiedad 9: Validación de elevación de cama**
    - **Valida: Requisitos 3.3**
  
  - [ ]* 3.4 Escribir pruebas unitarias para casos límite
    - Ventana de adherencia: exacto, ±1.5h, ±2h
    - Elevación: 0°, 30°, 31°, valores negativos
    - _Requisitos: 1.3, 3.3_


- [ ] 4. Implementar Notification Service
  - [ ] 4.1 Crear NotificationService con alertas duales
    - Implementar scheduleNotification
    - Implementar emitDualAlert (audio + visual)
    - Implementar setReminderIfUnattended (15 minutos)
    - Implementar cancelNotification
    - Implementar getUserPreferences
    - _Requisitos: 1.1, 11.1, 11.2, 11.5_
  
  - [ ]* 4.2 Escribir prueba de propiedad para precisión temporal
    - **Propiedad 28: Precisión temporal de notificaciones**
    - **Valida: Requisitos 11.1**
  
  - [ ]* 4.3 Escribir prueba de propiedad para alertas duales críticas
    - **Propiedad 29: Alertas duales para notificaciones críticas**
    - **Valida: Requisitos 11.2**
  
  - [ ]* 4.4 Escribir prueba de propiedad para recordatorios desatendidos
    - **Propiedad 31: Recordatorios por notificaciones desatendidas**
    - **Valida: Requisitos 11.5**

- [ ] 5. Implementar modelos de datos base
  - [ ] 5.1 Crear interfaces TypeScript para entidades principales
    - Definir Patient, Medication, MedicationEvent
    - Definir Notification, CareEvent
    - Definir User, UserPreferences
    - Implementar funciones de validación de modelos
    - _Requisitos: 9.1, 10.1_
  
  - [ ]* 5.2 Escribir prueba de propiedad para registro temporal universal
    - **Propiedad 2: Registro temporal universal de eventos**
    - **Valida: Requisitos 1.2, 1.4, 2.2, 3.6, 4.5, 5.2, 5.3, 9.1**

- [ ] 6. Checkpoint - Verificar servicios fundamentales
  - Asegurar que todas las pruebas pasen, preguntar al usuario si surgen dudas.

- [ ] 7. Implementar Medication Manager
  - [ ] 7.1 Crear MedicationManager con lógica de programación
    - Implementar scheduleMedication
    - Implementar confirmAdministration con validación de ventana
    - Implementar omitDose con justificación obligatoria
    - Implementar getMedicationSheet
    - Integrar con NotificationService para alertas
    - _Requisitos: 1.1, 1.3, 1.4, 1.5_
  
  - [ ]* 7.2 Escribir prueba de propiedad para emisión de alertas duales
    - **Propiedad 1: Emisión de alertas duales en horarios programados**
    - **Valida: Requisitos 1.1**
  
  - [ ]* 7.3 Escribir prueba de propiedad para justificación obligatoria
    - **Propiedad 4: Justificación obligatoria para acciones críticas**
    - **Valida: Requisitos 1.5, 6.6, 7.5**
  
  - [ ]* 7.4 Escribir pruebas unitarias para flujo de medicación
    - Programar → alertar → confirmar → registrar
    - Omitir sin justificación → bloqueado
    - Omitir con justificación → permitido
    - _Requisitos: 1.1, 1.3, 1.4, 1.5_

- [ ] 8. Implementar Fall Prevention Manager
  - [ ] 8.1 Crear FallPreventionManager con evaluación de riesgos
    - Implementar submitDailyChecklist
    - Implementar recordFallIncident con validación de "tiempo en el suelo"
    - Implementar getRiskAlerts basado en factores de riesgo
    - Implementar calculateRiskScore
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 8.2 Escribir prueba de propiedad para campo obligatorio
    - **Propiedad 5: Campo obligatorio de tiempo en el suelo**
    - **Valida: Requisitos 2.3**
  
  - [ ]* 8.3 Escribir prueba de propiedad para alertas por factores de riesgo
    - **Propiedad 6: Alertas automáticas por factores de riesgo**
    - **Valida: Requisitos 2.4, 2.5, 2.6**
  
  - [ ]* 8.4 Escribir pruebas unitarias para lista de verificación
    - Verificar campos requeridos: iluminación, suelos, calzado
    - _Requisitos: 2.1_

- [ ] 9. Implementar Skin Integrity Manager
  - [ ] 9.1 Crear SkinIntegrityManager con cambios posturales
    - Implementar schedulePosturalChanges (día: cada 2h, noche: 3x)
    - Implementar recordPosturalChange
    - Implementar recordBedElevation con validación
    - Implementar recordPressureUlcer con clasificación I-IV
    - Implementar carga de fotografías con timestamp
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ]* 9.2 Escribir prueba de propiedad para cambios posturales diurnos
    - **Propiedad 7: Programación de cambios posturales diurnos**
    - **Valida: Requisitos 3.1**
  
  - [ ]* 9.3 Escribir prueba de propiedad para cambios posturales nocturnos
    - **Propiedad 8: Programación de cambios posturales nocturnos**
    - **Valida: Requisitos 3.2**
  
  - [ ]* 9.4 Escribir pruebas unitarias para programación
    - Verificar 8 notificaciones diurnas (06:00-22:00)
    - Verificar 3 notificaciones nocturnas (22:00-06:00)
    - Verificar horarios exactos
    - _Requisitos: 3.1, 3.2_

- [ ] 10. Checkpoint - Verificar módulos de cuidado core
  - Asegurar que todas las pruebas pasen, preguntar al usuario si surgen dudas.


- [ ] 11. Implementar Nutrition Manager
  - [ ] 11.1 Crear NutritionManager con hidratación y dieta SEGG
    - Implementar scheduleHydrationReminders (6-8 vasos)
    - Implementar recordFluidIntake con actualización de contador
    - Implementar getDailyHydrationStatus
    - Implementar generateSEGGMealPlan (5 comidas, pescado, aceite de oliva, yogur)
    - Implementar recordMealIntake con timestamp
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 11.2 Escribir prueba de propiedad para estructura de plan de comidas
    - **Propiedad 10: Estructura de plan de comidas SEGG**
    - **Valida: Requisitos 4.3**
  
  - [ ]* 11.3 Escribir prueba de propiedad para contador de hidratación
    - **Propiedad 11: Actualización de contador de hidratación**
    - **Valida: Requisitos 4.4**
  
  - [ ]* 11.4 Escribir pruebas unitarias para plan SEGG
    - Verificar 5 comidas diarias
    - Verificar inclusión de alimentos SEGG
    - _Requisitos: 4.2, 4.3_

- [ ] 12. Implementar Incontinence Manager
  - [ ] 12.1 Crear IncontinenceManager con programación de baño
    - Implementar scheduleBathroomReminders (cada 2-3 horas)
    - Implementar recordBathroomVisit con timestamp
    - Implementar recordIncontinenceEpisode con timestamp
    - Implementar analyzePatterns para análisis de tendencias
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 12.2 Escribir prueba de propiedad para programación de recordatorios
    - **Propiedad 12: Programación de recordatorios de baño**
    - **Valida: Requisitos 5.1**
  
  - [ ]* 12.3 Escribir prueba de propiedad para persistencia de historial
    - **Propiedad 13: Persistencia de historial de episodios**
    - **Valida: Requisitos 5.4**

- [ ] 13. Implementar Polypharmacy Manager
  - [ ] 13.1 Crear PolypharmacyManager con gestión de medicamentos
    - Implementar addMedication, updateMedicationSheet
    - Implementar exportToPDF con todos los campos requeridos
    - Implementar checkStockLevels con alertas
    - Implementar checkExpirationDates con alertas
    - Implementar findNearestSIGREPoint con mapa
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 13.2 Escribir prueba de propiedad para exportación PDF
    - **Propiedad 14: Exportación PDF de hoja de medicamentos**
    - **Valida: Requisitos 6.2**
  
  - [ ]* 13.3 Escribir prueba de propiedad para alertas de stock bajo
    - **Propiedad 15: Alertas de stock bajo**
    - **Valida: Requisitos 6.3**
  
  - [ ]* 13.4 Escribir prueba de propiedad para alertas de caducidad
    - **Propiedad 16: Alertas de caducidad próxima**
    - **Valida: Requisitos 6.4**
  
  - [ ]* 13.5 Escribir pruebas unitarias para exportación PDF
    - Hoja vacía, 1 medicamento, múltiples medicamentos
    - Verificar formato PDF válido
    - _Requisitos: 6.2_

- [ ] 14. Implementar Ethical Care Module
  - [ ] 14.1 Crear EthicalCareModule con validación de restricciones
    - Implementar validateRestraint con bloqueo de restricciones químicas
    - Implementar classifyRestraint (químicas, mecánicas, ambientales)
    - Implementar getAlternativeStrategies (distracción, comunicación, ambiente)
    - Implementar requireJustification para todas las restricciones
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 14.2 Escribir prueba de propiedad para bloqueo de restricciones químicas
    - **Propiedad 17: Bloqueo de restricciones químicas**
    - **Valida: Requisitos 7.1**
  
  - [ ]* 14.3 Escribir prueba de propiedad para clasificación automática
    - **Propiedad 18: Clasificación automática de restricciones mecánicas**
    - **Valida: Requisitos 7.2**
  
  - [ ]* 14.4 Escribir prueba de propiedad para panel de alternativas
    - **Propiedad 19: Panel de estrategias alternativas**
    - **Valida: Requisitos 7.3**
  
  - [ ]* 14.5 Escribir pruebas unitarias para bloqueo de restricciones
    - Sedante para manejo conductual → bloqueado
    - Sedante para indicación médica → permitido
    - Verificar mensaje de advertencia
    - _Requisitos: 7.1_

- [ ] 15. Checkpoint - Verificar módulos de cuidado completos
  - Asegurar que todas las pruebas pasen, preguntar al usuario si surgen dudas.


- [ ] 16. Implementar Auth Service
  - [ ] 16.1 Crear AuthService con JWT y auto-logout
    - Implementar login con JWT
    - Implementar logout
    - Implementar refreshToken
    - Implementar checkSession
    - Implementar enforceAutoLogout (15 minutos de inactividad)
    - _Requisitos: 12.1, 12.4_
  
  - [ ]* 16.2 Escribir pruebas unitarias para auto-logout
    - Verificar cierre después de 15 minutos
    - Verificar que actividad resetea el temporizador
    - _Requisitos: 12.4_

- [ ] 17. Implementar Data Sync Service
  - [ ] 17.1 Crear DataSyncService con sincronización offline
    - Implementar syncPendingEvents
    - Implementar resolveConflicts (priorizar timestamp más reciente)
    - Implementar getConnectionStatus
    - Implementar enableOfflineMode
    - Implementar queueEventForSync
    - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ]* 17.2 Escribir prueba de propiedad para almacenamiento local offline
    - **Propiedad 34: Almacenamiento local de eventos offline**
    - **Valida: Requisitos 13.2**
  
  - [ ]* 17.3 Escribir prueba de propiedad para sincronización automática
    - **Propiedad 35: Sincronización automática al reconectar**
    - **Valida: Requisitos 13.3**
  
  - [ ]* 17.4 Escribir prueba de propiedad para resolución de conflictos
    - **Propiedad 36: Resolución de conflictos por timestamp**
    - **Valida: Requisitos 13.4**
  
  - [ ]* 17.5 Escribir pruebas de integración para flujo offline-online
    - Desconectar → registrar eventos → reconectar → verificar sincronización
    - _Requisitos: 13.1, 13.2, 13.3_

- [ ] 18. Implementar gestión de múltiples pacientes
  - [ ] 18.1 Crear lógica de gestión de perfiles de paciente
    - Implementar createPatientProfile
    - Implementar selectPatient con filtrado de datos
    - Implementar switchPatient
    - Implementar getPatientAlerts
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 18.2 Escribir prueba de propiedad para aislamiento de datos
    - **Propiedad 26: Aislamiento de datos por paciente**
    - **Valida: Requisitos 10.2, 10.5**
  
  - [ ]* 18.3 Escribir prueba de propiedad para indicadores de alertas
    - **Propiedad 27: Indicadores visuales de alertas pendientes**
    - **Valida: Requisitos 10.3**
  
  - [ ]* 18.4 Escribir pruebas de integración para múltiples pacientes
    - Crear 3 pacientes → registrar eventos → cambiar entre pacientes → verificar aislamiento
    - _Requisitos: 10.1, 10.2, 10.5_

- [ ] 19. Implementar sistema de historial y auditoría
  - [ ] 19.1 Crear funcionalidad de historial con filtrado
    - Implementar getHistory con ordenamiento cronológico
    - Implementar filterByEventType
    - Implementar filterByDateRange
    - Implementar exportHistoryWithTimestamps
    - Implementar protección de inmutabilidad para registros históricos
    - _Requisitos: 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 19.2 Escribir prueba de propiedad para orden cronológico
    - **Propiedad 22: Orden cronológico del historial**
    - **Valida: Requisitos 9.2**
  
  - [ ]* 19.3 Escribir prueba de propiedad para preservación de timestamps
    - **Propiedad 23: Preservación de timestamps en exportación**
    - **Valida: Requisitos 9.3**
  
  - [ ]* 19.4 Escribir prueba de propiedad para inmutabilidad
    - **Propiedad 24: Inmutabilidad de registros históricos**
    - **Valida: Requisitos 9.4**
  
  - [ ]* 19.5 Escribir prueba de propiedad para filtrado
    - **Propiedad 25: Filtrado de registros**
    - **Valida: Requisitos 9.5**

- [ ] 20. Implementar sistema de priorización de alertas
  - [ ] 20.1 Crear lógica de priorización y gestión de alertas
    - Implementar prioritizeAlerts (CRITICAL > HIGH > MEDIUM > LOW)
    - Implementar getAlertsByPriority
    - Integrar con NotificationService
    - _Requisitos: 11.3_
  
  - [ ]* 20.2 Escribir prueba de propiedad para priorización
    - **Propiedad 30: Priorización de alertas múltiples**
    - **Valida: Requisitos 11.3**

- [ ] 21. Checkpoint - Verificar servicios avanzados
  - Asegurar que todas las pruebas pasen, preguntar al usuario si surgen dudas.


- [ ] 22. Implementar componentes de UI base
  - [ ] 22.1 Crear componentes React base con tema oscuro/claro
    - Crear ThemeProvider con modo oscuro por defecto
    - Crear ThemeToggle para alternancia claro/oscuro
    - Implementar persistencia de preferencia de tema
    - Crear componentes base: Button, Input, Card, Alert en español
    - Configurar navegación entre pantallas
    - _Requisitos: 8.1, 8.2, 8.3, 8.5_
  
  - [ ]* 22.2 Escribir prueba de propiedad para persistencia de tema
    - **Propiedad 21: Persistencia de preferencia de tema**
    - **Valida: Requisitos 8.5**
  
  - [ ]* 22.3 Escribir prueba de propiedad para contenido en español
    - **Propiedad 20: Contenido en español**
    - **Valida: Requisitos 8.3**
  
  - [ ]* 22.4 Escribir pruebas unitarias para tema
    - Verificar modo oscuro por defecto
    - Verificar alternancia funciona
    - Verificar persistencia después de reload
    - _Requisitos: 8.1, 8.2, 8.5_

- [ ] 23. Implementar pantallas de gestión de medicamentos
  - [ ] 23.1 Crear UI para módulo de medicación
    - Pantalla de lista de medicamentos
    - Pantalla de agregar/editar medicamento
    - Pantalla de confirmación de dosis con validación de ventana
    - Modal de omisión con campo obligatorio de justificación
    - Alertas duales visuales y auditivas
    - _Requisitos: 1.1, 1.3, 1.4, 1.5_

- [ ] 24. Implementar pantallas de prevención de caídas
  - [ ] 24.1 Crear UI para módulo de prevención de caídas
    - Pantalla de lista de verificación diaria (iluminación, suelos, calzado)
    - Pantalla de registro de incidente con campo obligatorio "tiempo en el suelo"
    - Panel de alertas de riesgo (sedantes, cognitivo, visión)
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 25. Implementar pantallas de integridad de piel
  - [ ] 25.1 Crear UI para módulo de integridad de piel
    - Pantalla de registro de cambio postural
    - Pantalla de registro de elevación de cama con validación (máx 30°)
    - Pantalla de registro de UPP con clasificación I-IV
    - Funcionalidad de carga de fotografía con timestamp
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 26. Implementar pantallas de nutrición e incontinencia
  - [ ] 26.1 Crear UI para módulo de nutrición
    - Pantalla de plan de comidas SEGG
    - Pantalla de registro de ingesta con contador de vasos
    - Recordatorios de hidratación
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 26.2 Crear UI para módulo de incontinencia
    - Pantalla de registro de visita al baño
    - Pantalla de registro de episodio
    - Pantalla de análisis de patrones
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

- [ ] 27. Implementar pantallas de polifarmacia y cuidado ético
  - [ ] 27.1 Crear UI para módulo de polifarmacia
    - Pantalla de hoja dinámica de medicamentos
    - Botón de exportación PDF
    - Alertas de stock bajo y caducidad
    - Mapa de puntos SIGRE
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 27.2 Crear UI para módulo de cuidado ético
    - Modal de bloqueo para restricciones químicas
    - Panel de estrategias alternativas
    - Formulario de justificación obligatoria
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 28. Implementar pantallas de gestión de pacientes y configuración
  - [ ] 28.1 Crear UI para gestión de múltiples pacientes
    - Pantalla de lista de pacientes con indicadores de alertas
    - Selector rápido de paciente
    - Pantalla de agregar/editar perfil de paciente
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 28.2 Crear UI para configuración y preferencias
    - Pantalla de configuración de notificaciones
    - Pantalla de preferencias de usuario
    - Pantalla de autenticación y seguridad
    - _Requisitos: 11.4, 12.1_

- [ ] 29. Implementar pantallas de historial y exportación
  - [ ] 29.1 Crear UI para historial y auditoría
    - Pantalla de historial con ordenamiento cronológico
    - Filtros por tipo de evento y rango de fechas
    - Pantalla de exportación con confirmación
    - Indicador de estado de sincronización
    - _Requisitos: 9.2, 9.3, 9.5, 12.5, 13.5_
  
  - [ ]* 29.2 Escribir prueba de propiedad para confirmación de exportación
    - **Propiedad 33: Confirmación para exportación de datos**
    - **Valida: Requisitos 12.5**

- [ ] 30. Implementar manejo de errores en UI
  - [ ] 30.1 Crear componentes de manejo de errores
    - Componente ErrorBoundary
    - Componente ErrorMessage con mensajes en español
    - Toast/Snackbar para notificaciones de error
    - Modal de confirmación para acciones críticas
    - Implementar todos los mensajes de error del diseño
    - _Requisitos: 8.3_

- [ ] 31. Checkpoint - Verificar interfaz de usuario completa
  - Asegurar que todas las pruebas pasen, preguntar al usuario si surgen dudas.


- [ ] 32. Integración final y pruebas end-to-end
  - [ ] 32.1 Conectar todos los módulos
    - Integrar todos los managers con UI
    - Conectar NotificationService con todos los módulos
    - Conectar DataSyncService con todos los eventos
    - Verificar flujos completos de cada módulo
    - _Requisitos: Todos_
  
  - [ ]* 32.2 Escribir pruebas de integración para flujos principales
    - Flujo completo de medicación: programar → alertar → confirmar → registrar
    - Flujo de caída con factores de riesgo
    - Flujo offline-online completo
    - Flujo de múltiples pacientes
    - _Requisitos: 1.1, 1.3, 1.4, 2.3, 2.4, 13.1, 13.2, 13.3, 10.2_
  
  - [ ]* 32.3 Verificar cobertura de pruebas
    - Ejecutar reporte de cobertura
    - Verificar mínimo 80% de cobertura
    - Verificar 100% en validaciones críticas
    - _Requisitos: Todos_

- [ ] 33. Optimización y accesibilidad
  - [ ] 33.1 Implementar optimizaciones de rendimiento
    - Optimizar carga inicial (< 3 segundos)
    - Optimizar respuesta de UI (< 100ms)
    - Optimizar sincronización de eventos
    - Optimizar exportación PDF
    - _Requisitos: 8.4_
  
  - [ ] 33.2 Implementar características de accesibilidad
    - Verificar contraste de colores en ambos temas
    - Implementar navegación por teclado
    - Agregar etiquetas ARIA en español
    - Verificar tamaños táctiles mínimos (44x44px)
    - _Requisitos: 8.3, 8.4_

- [ ] 34. Documentación y despliegue
  - [ ] 34.1 Crear documentación
    - README con instrucciones de instalación
    - Documentación de API de componentes
    - Guía de usuario en español
    - Documentación de arquitectura
    - _Requisitos: 8.3_
  
  - [ ] 34.2 Preparar para despliegue
    - Configurar build de producción
    - Configurar variables de entorno
    - Preparar assets y recursos
    - Configurar CI/CD si aplica
    - _Requisitos: Todos_

- [ ] 35. Checkpoint final - Verificación completa del sistema
  - Asegurar que todas las pruebas pasen, verificar que todos los requisitos estén implementados, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Las pruebas de propiedades validan corrección universal
- Las pruebas unitarias validan ejemplos específicos y casos límite
- Todas las pruebas de propiedades deben ejecutarse con mínimo 100 iteraciones
- Todo el contenido de UI debe estar en español
- El diseño debe ser responsivo con prioridad móvil

