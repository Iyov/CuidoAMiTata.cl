# Plan de Implementación: Identidad Chile y Servicios Centrales

## Resumen

Este plan implementa la identidad chilena y los cuatro servicios centrales de CuidoAMiTata.cl:
1. Identidad Chile en landing y aplicación
2. Bitácora diaria
3. Soporte multi-familiar
4. Botón de pánico

## Tareas

- [x] 1. Configurar esquema de base de datos en Supabase
  - Crear tablas: profiles, families, family_members, patients, bitacora_entries, panic_events, panic_notifications, invitations
  - Configurar políticas RLS para aislamiento por familia
  - Crear tipos ENUM: family_role, mood_type, invitation_status, notification_status
  - Documentar esquemas SQL en docs/supabase-schema.sql
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 10.1, 10.2, 11.1, 11.2, 11.4, 11.5_

- [x] 2. Actualizar tipos TypeScript para nuevos modelos
  - Agregar tipos en src/types/models.ts: Family, FamilyMember, FamilyRole, BitacoraEntry, BitacoraEntryInput, MoodType, PanicEvent, PanicNotification, Invitation, EmailResult, NotificationResult
  - Agregar códigos de error en src/types/enums.ts para bitácora, familia y pánico
  - Actualizar exports en src/types/index.ts
  - _Requisitos: 3.1, 3.2, 5.1, 5.2, 8.4, 9.3_

- [ ] 3. Actualizar identidad Chile en landing page
  - [x] 3.1 Actualizar index.html con contenido chileno
    - Modificar meta tags con keywords chilenas (Chile, SENAMA, cuidado adultos mayores Chile)
    - Actualizar títulos y descripciones en español chileno
    - Reemplazar referencias a España/SEGG con contexto chileno
    - Verificar enlaces a app.html funcionan correctamente
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 3.2 Escribir pruebas unitarias para landing
    - Verificar presencia de keywords chilenas en meta tags
    - Verificar ausencia de referencias a España como marco principal
    - Verificar enlaces a app.html
    - _Requisitos: 1.2, 1.3, 1.4, 1.5_

- [ ] 4. Actualizar textos de aplicación a español chileno
  - [x] 4.1 Actualizar src/App.tsx
    - Cambiar textos de navegación a español chileno
    - Actualizar títulos de secciones
    - Usar términos chilenos (tata, cuidador)
    - _Requisitos: 2.1, 2.3, 2.4_
  
  - [x] 4.2 Actualizar pantallas existentes
    - Revisar y actualizar textos en src/screens/*.tsx
    - Reemplazar terminología española con chilena
    - Actualizar mensajes de error y confirmación
    - _Requisitos: 2.1, 2.3, 2.5, 14.2, 15.1, 15.4_
  
  - [x] 4.3 Crear utilidad de formato de fecha chileno
    - Crear src/utils/dateFormat.ts con función formatDateChile(date: Date): string
    - Formato: DD/MM/YYYY
    - Exportar desde src/utils/index.ts
    - _Requisitos: 2.2_
  
  - [ ]* 4.4 Escribir prueba de propiedad para formato de fecha
    - **Propiedad 2: Formato de fecha chileno**
    - **Valida: Requisitos 2.2**

- [x] 5. Checkpoint - Verificar identidad Chile
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 6. Implementar servicios de bitácora
  - [x] 6.1 Crear BitacoraService
    - Crear src/services/BitacoraService.ts
    - Implementar métodos: save, findByPatientAndDate, findByPatientAndDateRange, update
    - Usar cliente de Supabase para operaciones CRUD
    - Manejar errores con patrón Result
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 6.2 Crear BitacoraManager
    - Crear src/services/BitacoraManager.ts
    - Implementar lógica de negocio: createEntry, getEntriesByDate, getEntriesByDateRange, updateEntry, canEdit
    - Validar fecha no futura, al menos un campo completo, ventana de edición 24h
    - Integrar con BitacoraService
    - _Requisitos: 3.1, 3.2, 4.3, 4.5_
  
  - [ ]* 6.3 Escribir prueba de propiedad para round-trip de bitácora
    - **Propiedad 1: Round-trip de bitácora**
    - **Valida: Requisitos 3.1, 3.2, 3.3, 3.4, 3.5, 4.3**
  
  - [ ]* 6.4 Escribir prueba de propiedad para ordenamiento cronológico
    - **Propiedad 3: Ordenamiento cronológico de bitácora**
    - **Valida: Requisitos 4.4**
  
  - [ ]* 6.5 Escribir prueba de propiedad para ventana de edición
    - **Propiedad 4: Ventana de edición de bitácora**
    - **Valida: Requisitos 4.5**
  
  - [ ]* 6.6 Escribir pruebas unitarias para validaciones
    - Fecha futura debe rechazarse
    - Entrada vacía debe rechazarse
    - Edición después de 24h debe rechazarse
    - _Requisitos: 4.5_

- [ ] 7. Implementar interfaz de bitácora
  - [x] 7.1 Crear BitacoraScreen
    - Crear src/screens/BitacoraScreen.tsx
    - Implementar selector de fecha (por defecto: hoy)
    - Implementar formulario con campos: comidas (desayuno, almuerzo, cena, colaciones), ánimo, actividades
    - Implementar lista de entradas históricas ordenadas por fecha
    - Implementar edición de entradas (solo si < 24h y mismo usuario)
    - Integrar con BitacoraManager
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 7.2 Escribir pruebas unitarias para BitacoraScreen
    - Formulario muestra fecha actual por defecto
    - Formulario tiene todos los campos requeridos
    - Entradas se muestran ordenadas por fecha
    - _Requisitos: 4.1, 4.2, 4.4_

- [x] 8. Checkpoint - Verificar bitácora funcional
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 9. Implementar servicios multi-familiar
  - [x] 9.1 Crear FamilyService
    - Crear src/services/FamilyService.ts
    - Implementar métodos CRUD para families, family_members, invitations
    - Usar cliente de Supabase con políticas RLS
    - Manejar errores con patrón Result
    - _Requisitos: 5.1, 5.2, 5.3, 6.1_
  
  - [x] 9.2 Crear FamilyManager
    - Crear src/services/FamilyManager.ts
    - Implementar lógica: createFamily, inviteMember, removeMember, updateMemberRole, getFamilyMembers, getUserFamilies, acceptInvitation
    - Validar permisos (solo admins pueden invitar/remover)
    - Validar no remover último admin
    - Validar email válido
    - Generar tokens de invitación
    - _Requisitos: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 9.3 Escribir prueba de propiedad para integridad de familia
    - **Propiedad 5: Integridad de familia y membresía**
    - **Valida: Requisitos 5.1, 5.2, 5.3**
  
  - [ ]* 9.4 Escribir prueba de propiedad para aislamiento de datos
    - **Propiedad 6: Aislamiento de datos por familia**
    - **Valida: Requisitos 5.5, 7.2, 11.3, 14.3**
  
  - [ ]* 9.5 Escribir prueba de propiedad para gestión de roles
    - **Propiedad 7: Gestión de roles por administrador**
    - **Valida: Requisitos 6.2, 6.3**
  
  - [ ]* 9.6 Escribir prueba de propiedad para aceptación de invitación
    - **Propiedad 8: Aceptación de invitación**
    - **Valida: Requisitos 6.4**
  
  - [ ]* 9.7 Escribir prueba de propiedad para lista de miembros
    - **Propiedad 9: Lista completa de miembros**
    - **Valida: Requisitos 6.5**
  
  - [ ]* 9.8 Escribir pruebas unitarias para validaciones
    - No se puede remover último admin
    - Email inválido debe rechazarse
    - Usuario no-admin no puede invitar
    - _Requisitos: 6.2, 6.3_

- [ ] 10. Implementar contexto y selector de familia
  - [x] 10.1 Crear FamilyContext
    - Crear src/contexts/FamilyContext.tsx
    - Implementar estado global: currentFamily, families, members, isLoading
    - Implementar funciones: switchFamily, refreshMembers
    - Persistir familia seleccionada en localStorage
    - _Requisitos: 5.5, 7.1, 7.2, 7.3, 7.5_
  
  - [x] 10.2 Crear FamilySelector component
    - Crear src/components/FamilySelector.tsx
    - Mostrar dropdown con familias del usuario
    - Mostrar nombre de familia actual
    - Permitir cambio de familia
    - Solo mostrar si usuario tiene múltiples familias
    - _Requisitos: 7.1, 7.2, 7.4, 7.5_
  
  - [ ]* 10.3 Escribir prueba de propiedad para persistencia de selección
    - **Propiedad 10: Persistencia de selección de familia**
    - **Valida: Requisitos 7.3**
  
  - [ ]* 10.4 Escribir pruebas unitarias para FamilySelector
    - Selector aparece con múltiples familias
    - Nombre de familia actual se muestra
    - Cambio de familia actualiza datos
    - _Requisitos: 7.1, 7.4, 7.5_

- [ ] 11. Implementar interfaz de gestión familiar
  - [x] 11.1 Crear FamilyScreen
    - Crear src/screens/FamilyScreen.tsx
    - Implementar lista de miembros con roles
    - Implementar formulario de invitación (email + rol)
    - Implementar botones de gestión (cambiar rol, remover)
    - Implementar gestión de pacientes del grupo
    - Solo admins ven opciones de gestión
    - Integrar con FamilyManager
    - _Requisitos: 6.1, 6.2, 6.3, 6.5_
  
  - [ ]* 11.2 Escribir pruebas unitarias para FamilyScreen
    - Lista muestra todos los miembros con roles
    - Formulario de invitación visible para admins
    - Botones de gestión solo para admins
    - _Requisitos: 6.5_

- [x] 12. Checkpoint - Verificar multi-familiar funcional
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 13. Implementar servicios de pánico
  - [x] 13.1 Crear EmailService
    - Crear src/services/EmailService.ts
    - Implementar sendPanicAlert usando Supabase Edge Functions
    - Implementar sendInvitation
    - Implementar lógica de reintentos (máximo 3)
    - Registrar estado de envío en panic_notifications
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 13.2 Crear PanicManager
    - Crear src/services/PanicManager.ts
    - Implementar triggerPanic: registrar evento, obtener contactos, enviar notificaciones
    - Implementar getPanicHistory
    - Implementar notifyFamilyMembers
    - Integrar con EmailService
    - _Requisitos: 8.4, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 13.3 Escribir prueba de propiedad para registro de evento
    - **Propiedad 11: Registro de evento de pánico con timestamp**
    - **Valida: Requisitos 8.4**
  
  - [ ]* 13.4 Escribir prueba de propiedad para recuperación de contactos
    - **Propiedad 12: Recuperación de contactos para pánico**
    - **Valida: Requisitos 9.1**
  
  - [ ]* 13.5 Escribir prueba de propiedad para envío de notificaciones
    - **Propiedad 13: Envío de notificaciones de pánico**
    - **Valida: Requisitos 9.2**
  
  - [ ]* 13.6 Escribir prueba de propiedad para contenido de notificación
    - **Propiedad 14: Contenido de notificación de pánico**
    - **Valida: Requisitos 9.3**
  
  - [ ]* 13.7 Escribir prueba de propiedad para registro de estado
    - **Propiedad 15: Registro de estado de notificaciones**
    - **Valida: Requisitos 9.4**
  
  - [ ]* 13.8 Escribir prueba de propiedad para reintentos
    - **Propiedad 16: Reintentos de notificación**
    - **Valida: Requisitos 9.5**
  
  - [ ]* 13.9 Escribir pruebas unitarias para casos borde
    - Familia sin miembros (debe manejar gracefully)
    - Fallo de envío de email
    - _Requisitos: 9.1, 9.5_

- [ ] 14. Implementar interfaz de botón de pánico
  - [x] 14.1 Crear PanicButton component
    - Crear src/components/PanicButton.tsx
    - Implementar botón rojo prominente con ícono de alerta
    - Implementar diálogo de confirmación
    - Implementar feedback visual de éxito/error
    - Soportar props: patientId, size, position
    - Integrar con PanicManager
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 14.2 Escribir pruebas unitarias para PanicButton
    - Diálogo de confirmación aparece al presionar
    - Mensaje de éxito después de envío
    - Botón es visualmente prominente
    - _Requisitos: 8.3, 8.5_

- [x] 15. Integrar botón de pánico en pantallas
  - Agregar PanicButton a HomePage
  - Agregar PanicButton a MedicationListScreen
  - Agregar PanicButton a FallPreventionScreen
  - Usar position="fixed" para visibilidad constante
  - _Requisitos: 8.1_

- [x] 16. Checkpoint - Verificar botón de pánico funcional
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 17. Actualizar autenticación y perfiles
  - [x] 17.1 Actualizar ProfileService
    - Agregar métodos: updateFamilyAssociation, getUserRole
    - Integrar con tabla profiles de Supabase
    - _Requisitos: 10.2, 10.3_
  
  - [x] 17.2 Actualizar AuthScreen
    - Actualizar textos a español chileno
    - Agregar soporte para registro con token de invitación (query param)
    - Crear perfil automáticamente al registrar
    - _Requisitos: 10.1, 10.2, 10.3_
  
  - [ ]* 17.3 Escribir prueba de propiedad para creación de perfil
    - **Propiedad 17: Creación de perfil al registrar**
    - **Valida: Requisitos 10.2, 10.3**
  
  - [ ]* 17.4 Escribir prueba de propiedad para persistencia de sesión
    - **Propiedad 18: Persistencia de sesión**
    - **Valida: Requisitos 10.5**
  
  - [ ]* 17.5 Escribir pruebas unitarias para autenticación
    - Registro con Supabase Auth
    - Recuperación de contraseña disponible
    - Logout limpia sesión
    - _Requisitos: 10.1, 10.4_

- [ ] 18. Actualizar navegación y rutas
  - [x] 18.1 Agregar rutas en App.tsx
    - Agregar ruta /bitacora → BitacoraScreen
    - Agregar ruta /family → FamilyScreen
    - Verificar basename configurado correctamente
    - _Requisitos: 12.1, 12.3_
  
  - [x] 18.2 Actualizar HomePage con nuevos servicios
    - Agregar enlace a Bitácora Diaria
    - Agregar enlace a Gestión Familiar
    - Actualizar textos a español chileno
    - Agregar FamilySelector en header
    - Resaltar ruta activa
    - _Requisitos: 12.1, 12.2, 12.5_
  
  - [ ]* 18.3 Escribir pruebas unitarias para navegación
    - Rutas están definidas correctamente
    - Menú contiene enlaces a servicios centrales
    - Ruta activa está resaltada
    - _Requisitos: 12.1, 12.2, 12.5_

- [ ] 19. Integrar multi-familiar con módulos existentes
  - [x] 19.1 Actualizar MedicationManager
    - Filtrar medicamentos por familia actual
    - Asociar nuevos medicamentos a familia
    - _Requisitos: 14.3_
  
  - [x] 19.2 Actualizar pantallas de medicación
    - Actualizar textos a español chileno
    - Verificar filtrado por familia funciona
    - _Requisitos: 14.1, 14.2, 14.3_
  
  - [x] 19.3 Actualizar módulos de soporte
    - Actualizar textos a español chileno en: FallPreventionScreen, SkinIntegrityScreen, PolypharmacyScreen, EthicalCareScreen
    - Reemplazar referencias a España con Chile donde aplique
    - Filtrar datos por familia actual
    - _Requisitos: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ]* 19.4 Escribir pruebas unitarias para integración
    - Medicación filtra por familia
    - Módulos de soporte funcionan correctamente
    - _Requisitos: 14.3, 15.3_

- [x] 20. Checkpoint - Verificar integración completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 21. Crear documentación SQL de Supabase
  - Crear docs/supabase-schema.sql con todos los CREATE TABLE y políticas RLS
  - Crear docs/supabase-migrations.md con instrucciones de aplicación
  - Documentar configuración de Supabase Edge Functions para emails
  - _Requisitos: 11.4, 11.5_

- [ ] 22. Actualizar workflow de despliegue
  - [x] 22.1 Verificar .github/workflows/deploy.yml
    - Verificar que usa GitHub Secrets para VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
    - Verificar que genera 404.html desde app.html
    - Verificar que sube artefacto a GitHub Pages
    - _Requisitos: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 22.2 Actualizar documentación de despliegue
    - Actualizar docs/despliegue-github-pages.md con nuevos requisitos
    - Documentar configuración de Secrets
    - Documentar verificación post-despliegue
    - _Requisitos: 13.1, 13.5_

- [ ] 23. Verificación final y documentación
  - [x] 23.1 Ejecutar suite completa de tests
    - npm run type-check
    - npm test
    - npm run test:coverage
    - Verificar cobertura > 80%
  
  - [x] 23.2 Verificar build de producción
    - npm run build
    - npm run preview
    - Verificar que no hay errores
    - Verificar que landing y app cargan correctamente
  
  - [x] 23.3 Actualizar README.md
    - Documentar nuevos servicios (bitácora, multi-familiar, pánico)
    - Documentar configuración de Supabase requerida
    - Documentar variables de entorno
  
  - [x] 23.4 Actualizar docs/SPECS.md
    - Agregar referencia a este spec
    - Documentar estado de implementación

- [x] 24. Checkpoint final - Preparar para despliegue
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.
  - Verificar que la documentación está completa.
  - Confirmar que el usuario está listo para desplegar a producción.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos que valida
- Los checkpoints aseguran validación incremental
- Las pruebas de propiedades usan fast-check con mínimo 100 iteraciones
- Todas las pruebas deben etiquetarse con: `// Feature: chile-identity-and-core-services, Property N: <texto>`
- El despliegue a producción requiere configurar GitHub Secrets antes del primer deploy
