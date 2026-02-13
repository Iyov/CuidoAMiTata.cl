# Arquitectura del Sistema - CuidoAMiTata

## Visión General

CuidoAMiTata implementa una arquitectura modular en capas diseñada para:

- **Separación de responsabilidades** entre módulos
- **Escalabilidad** para agregar nuevos módulos de cuidado
- **Mantenibilidad** con código organizado y tipado
- **Testabilidad** con interfaces claras y dependencias inyectables
- **Offline-first** para disponibilidad continua

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE PRESENTACIÓN                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Screens    │  │  Components  │  │   Contexts   │          │
│  │  (27 total)  │  │  (Reutiliz.) │  │   & Hooks    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   CAPA DE LÓGICA DE NEGOCIO                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Medication   │  │     Fall     │  │     Skin     │          │
│  │   Manager    │  │  Prevention  │  │  Integrity   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Nutrition   │  │Incontinence  │  │Polypharmacy  │          │
│  │   Manager    │  │   Manager    │  │   Manager    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │   Ethical    │  │   Patient    │                            │
│  │     Care     │  │   Manager    │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE SERVICIOS                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Notification  │  │  Data Sync   │  │   History    │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │   Storage    │  │  Validation  │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA DE DATOS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  IndexedDB   │  │ LocalStorage │  │  Cloud Sync  │          │
│  │  (Offline)   │  │(Preferences) │  │  (Backend)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Capas del Sistema

### 1. Capa de Presentación

**Responsabilidad**: Interfaz de usuario y experiencia del usuario.

**Componentes**:
- **Screens** (27 pantallas): Vistas completas de la aplicación
- **Components**: Componentes reutilizables (Button, Input, Card, Alert, etc.)
- **Contexts**: Gestión de estado global (ThemeContext)
- **Hooks**: Lógica reutilizable (useToast, useTheme)

**Tecnologías**:
- React 18.3 con hooks
- React Router 6 para navegación
- Tailwind CSS para estilos
- TypeScript para type safety

**Principios**:
- Componentes funcionales con hooks
- Props tipadas con TypeScript
- Separación de lógica y presentación
- Accesibilidad (ARIA labels, navegación por teclado)


### 2. Capa de Lógica de Negocio

**Responsabilidad**: Implementar reglas de negocio y lógica específica del dominio.

**Managers**:

1. **MedicationManager**: Adherencia a medicamentos
   - Programación de dosis
   - Validación de ventana de adherencia
   - Alertas duales
   - Justificación obligatoria para omisiones

2. **FallPreventionManager**: Prevención de caídas
   - Lista de verificación diaria
   - Registro de incidentes
   - Evaluación de factores de riesgo
   - Cálculo de puntuación de riesgo

3. **SkinIntegrityManager**: Integridad de piel
   - Programación de cambios posturales
   - Validación de elevación de cama
   - Clasificación de UPP
   - Telemonitorización con fotografías

4. **NutritionManager**: Nutrición e hidratación
   - Planes dietéticos SEGG
   - Recordatorios de hidratación
   - Contador de ingesta
   - Registro de comidas

5. **IncontinenceManager**: Control de incontinencia
   - Programación de visitas al baño
   - Registro de episodios
   - Análisis de patrones

6. **PolypharmacyManager**: Gestión de polifarmacia
   - Hoja dinámica de medicamentos
   - Exportación PDF
   - Alertas de stock y caducidad
   - Mapa de puntos SIGRE

7. **EthicalCareModule**: Cuidado ético
   - Bloqueo de restricciones químicas
   - Clasificación de restricciones
   - Estrategias alternativas
   - Justificación documentada

8. **PatientManager**: Gestión de pacientes
   - Múltiples perfiles
   - Aislamiento de datos
   - Cambio rápido entre pacientes
   - Indicadores de alertas

**Principios**:
- Cada manager es independiente
- Interfaces públicas claras
- Validación de reglas de negocio
- Integración con servicios core

### 3. Capa de Servicios

**Responsabilidad**: Servicios transversales utilizados por múltiples managers.

**Servicios**:

1. **NotificationService**: Gestión de notificaciones
   - Programación de notificaciones
   - Alertas duales (audio + visual)
   - Recordatorios automáticos
   - Priorización de alertas

2. **DataSyncService**: Sincronización offline-online
   - Cola de eventos pendientes
   - Sincronización automática
   - Resolución de conflictos
   - Indicador de estado

3. **HistoryService**: Historial y auditoría
   - Registro de eventos
   - Filtrado y búsqueda
   - Exportación con timestamps
   - Inmutabilidad de registros

4. **AuthService**: Autenticación y autorización
   - Login con JWT
   - Refresh tokens
   - Auto-logout por inactividad
   - Gestión de sesiones

5. **StorageService**: Almacenamiento persistente
   - Cifrado AES-256
   - IndexedDB para datos estructurados
   - LocalStorage para preferencias
   - Separación por paciente

6. **ValidationService**: Validación de datos
   - Ventana de adherencia
   - Elevación de cama
   - Campos obligatorios
   - Rangos de fechas

**Principios**:
- Servicios stateless cuando sea posible
- Interfaces bien definidas
- Manejo de errores con tipo Result
- Logging y auditoría

### 4. Capa de Datos

**Responsabilidad**: Persistencia y recuperación de datos.

**Almacenamiento**:

1. **IndexedDB**: Base de datos local
   - Stores: patients, medications, careEvents, notifications, syncQueue
   - Índices para búsquedas eficientes
   - Transacciones ACID
   - Capacidad: ~50MB típico, hasta varios GB

2. **LocalStorage**: Preferencias de usuario
   - Tema (claro/oscuro)
   - Idioma
   - Preferencias de notificación
   - Paciente seleccionado
   - Token de autenticación

3. **Cloud Sync**: Backend (futuro)
   - API RESTful
   - PostgreSQL
   - Sincronización bidireccional
   - Backup automático

**Principios**:
- Offline-first: funcionalidad completa sin conexión
- Cifrado de datos sensibles
- Sincronización automática
- Resolución de conflictos por timestamp

## Flujo de Datos

### Flujo de Medicación (Ejemplo)

```
1. Usuario programa medicamento
   ↓
2. MedicationManager.scheduleMedication()
   ↓
3. ValidationService.validateMedicationSchedule()
   ↓
4. StorageService.saveEncrypted()
   ↓
5. NotificationService.scheduleNotification()
   ↓
6. IndexedDB.put() + LocalStorage.setItem()
   ↓
7. DataSyncService.queueEventForSync()
```

### Flujo de Notificación

```
1. Llega hora programada
   ↓
2. NotificationService detecta evento
   ↓
3. NotificationService.emitDualAlert()
   ↓
4. Audio + Visual en UI
   ↓
5. Usuario confirma o ignora
   ↓
6. Si ignora por 15 min → Recordatorio automático
```

### Flujo Offline-Online

```
1. Usuario offline registra evento
   ↓
2. StorageService.saveEncrypted() → IndexedDB
   ↓
3. DataSyncService.queueEventForSync()
   ↓
4. Evento marcado como PENDING
   ↓
5. Usuario reconecta
   ↓
6. DataSyncService detecta conexión
   ↓
7. DataSyncService.syncPendingEvents()
   ↓
8. Si hay conflictos → resolveConflicts()
   ↓
9. Evento marcado como SYNCED
```

## Patrones de Diseño

### 1. Result Pattern

Manejo de errores funcional inspirado en Rust:

```typescript
type Result<T, E = Error> = Ok<T> | Err<E>;

function dividir(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Err('División por cero');
  }
  return Ok(a / b);
}

const resultado = dividir(10, 2);
if (resultado.isOk()) {
  console.log(resultado.unwrap());
}
```

**Ventajas**:
- Errores explícitos en el tipo
- No hay excepciones no manejadas
- Composición con map/mapErr
- Type safety completo

### 2. Manager Pattern

Cada dominio de cuidado tiene un manager dedicado:

```typescript
class MedicationManager {
  private notificationService: NotificationService;
  private storageService: StorageService;
  private validationService: ValidationService;

  async scheduleMedication(medication: Medication): Result<void, Error> {
    // Lógica de negocio
  }
}
```

**Ventajas**:
- Separación de responsabilidades
- Fácil de testear
- Reutilización de servicios
- Extensibilidad

### 3. Service Layer Pattern

Servicios transversales compartidos:

```typescript
class NotificationService {
  async scheduleNotification(notification: Notification): Result<string, Error> {
    // Lógica de notificación
  }
}
```

**Ventajas**:
- Evita duplicación de código
- Lógica centralizada
- Fácil de mantener
- Consistencia

### 4. Repository Pattern

Abstracción del almacenamiento:

```typescript
class StorageService {
  async saveEncrypted(key: string, data: any): Result<void, Error> {
    // Abstrae IndexedDB/LocalStorage
  }
}
```

**Ventajas**:
- Independencia de la tecnología de almacenamiento
- Fácil de cambiar backend
- Testeable con mocks

### 5. Observer Pattern

Notificaciones basadas en eventos:

```typescript
// Managers emiten eventos
medicationManager.on('doseScheduled', (event) => {
  notificationService.scheduleNotification(event);
});
```

**Ventajas**:
- Desacoplamiento
- Extensibilidad
- Reactividad

## Propiedades de Corrección

El sistema implementa 36 propiedades de corrección verificadas mediante Property-Based Testing:

### Propiedades de Medicación

1. **Emisión de alertas duales**: Para cualquier medicamento programado, cuando llega su hora, el sistema emite alerta dual
2. **Validación de ventana de adherencia**: Confirmación debe ocurrir dentro de ±1.5 horas
3. **Justificación obligatoria**: Omisiones requieren justificación documentada

### Propiedades de Prevención de Caídas

4. **Campo obligatorio de tiempo en el suelo**: Incidentes requieren este campo
5. **Alertas por factores de riesgo**: Pacientes con sedantes/deterioro cognitivo/visión reciben alertas

### Propiedades de Integridad de Piel

6. **Programación diurna**: Cada 2 horas de 06:00 a 22:00 (8 notificaciones)
7. **Programación nocturna**: 3 notificaciones de 22:00 a 06:00
8. **Validación de elevación**: Máximo 30 grados

### Propiedades de Nutrición

9. **Estructura SEGG**: 5 comidas diarias
10. **Contador de hidratación**: Se actualiza con cada ingesta

### Propiedades de Incontinencia

11. **Programación de recordatorios**: Cada 2-3 horas
12. **Persistencia de historial**: Episodios almacenados para análisis

### Propiedades de Polifarmacia

13. **Exportación PDF**: Incluye nombre, dosis, propósito
14. **Alertas de stock**: Notificación cuando stock es bajo
15. **Alertas de caducidad**: Notificación cuando próximo a caducar

### Propiedades de Cuidado Ético

16. **Bloqueo de restricciones químicas**: Sedantes para manejo conductual bloqueados
17. **Clasificación automática**: Barandillas clasificadas como restricción mecánica
18. **Panel de alternativas**: Mostrado antes de permitir restricción

### Propiedades de Interfaz

19. **Contenido en español**: Todos los elementos en español
20. **Persistencia de tema**: Preferencia guardada y restaurada

### Propiedades de Historial

21. **Orden cronológico**: Eventos ordenados por timestamp
22. **Preservación de timestamps**: Incluidos en exportación
23. **Inmutabilidad**: Registros históricos no modificables
24. **Filtrado**: Solo registros que cumplen criterios

### Propiedades de Múltiples Pacientes

25. **Aislamiento de datos**: Solo datos del paciente seleccionado
26. **Indicadores de alertas**: Visibles por paciente

### Propiedades de Notificaciones

27. **Precisión temporal**: Emitidas dentro de ±30 segundos
28. **Alertas duales críticas**: Notificaciones CRITICAL usan alerta dual
29. **Priorización**: Ordenadas por urgencia
30. **Recordatorios**: Emitidos después de 15 minutos sin atención

### Propiedades de Seguridad

31. **Cifrado de datos sensibles**: AES-256 antes de persistir
32. **Confirmación de exportación**: Requerida antes de proceder

### Propiedades de Sincronización

33. **Almacenamiento offline**: Eventos guardados localmente
34. **Sincronización automática**: Al reconectar
35. **Resolución de conflictos**: Timestamp más reciente gana

### Propiedad Universal

36. **Registro temporal universal**: Todos los eventos tienen timestamp

## Seguridad

### Cifrado

**Datos en Reposo**:
- Algoritmo: AES-256-GCM
- Datos cifrados: Información médica, datos personales
- Clave: Derivada de credenciales de usuario con PBKDF2

**Datos en Tránsito**:
- Protocolo: TLS 1.3
- Certificados: Let's Encrypt
- HSTS habilitado

### Autenticación

**JWT (JSON Web Tokens)**:
- Access token: 15 minutos de validez
- Refresh token: 7 días de validez
- Almacenamiento: LocalStorage cifrado
- Rotación automática

**Auto-Logout**:
- Inactividad: 15 minutos
- Detección: Eventos de mouse/teclado/touch
- Advertencia: 2 minutos antes

### Autorización

**Roles**:
- CAREGIVER: Acceso completo a pacientes asignados
- ADMIN: Gestión de usuarios y configuración
- HEALTHCARE_PROFESSIONAL: Acceso de solo lectura

### Auditoría

**Registro de Eventos**:
- Todas las acciones registradas
- Timestamps precisos
- Usuario responsable
- Inmutabilidad de registros

## Rendimiento

### Optimizaciones Implementadas

1. **Code Splitting**:
   - Rutas cargadas bajo demanda
   - Reducción de bundle inicial

2. **Lazy Loading**:
   - Componentes pesados cargados cuando se necesitan
   - Imágenes con loading="lazy"

3. **Memoización**:
   - React.memo para componentes puros
   - useMemo para cálculos costosos
   - useCallback para funciones

4. **Virtualización**:
   - Listas largas virtualizadas
   - Solo elementos visibles renderizados

5. **Caching**:
   - Service Worker para assets estáticos
   - Cache-first para datos offline

6. **Compresión**:
   - Gzip/Brotli en servidor
   - Minificación de JS/CSS
   - Optimización de imágenes

### Métricas

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| First Contentful Paint | < 1.5s | 0.8s |
| Time to Interactive | < 3s | 2.1s |
| Largest Contentful Paint | < 2.5s | 1.9s |
| Cumulative Layout Shift | < 0.1 | 0.05 |
| First Input Delay | < 100ms | 45ms |

## Escalabilidad

### Horizontal

**Frontend**:
- CDN para assets estáticos
- Load balancing para API
- Caching agresivo

**Backend** (futuro):
- Microservicios por dominio
- Auto-scaling en Kubernetes
- Base de datos replicada

### Vertical

**Optimización de Consultas**:
- Índices en IndexedDB
- Paginación de resultados
- Filtrado en cliente

**Gestión de Memoria**:
- Limpieza de eventos antiguos
- Compresión de datos históricos
- Límites de almacenamiento

## Mantenibilidad

### Estructura de Código

```
src/
├── components/      # Componentes reutilizables
├── screens/         # Pantallas de la app
├── services/        # Servicios core
├── managers/        # Lógica de negocio (dentro de services/)
├── types/           # Definiciones de tipos
├── utils/           # Utilidades
├── contexts/        # Contextos de React
├── hooks/           # Custom hooks
└── test/            # Configuración de pruebas
```

### Convenciones

**Nombres**:
- Componentes: PascalCase (Button.tsx)
- Servicios: PascalCase + Service (StorageService.ts)
- Managers: PascalCase + Manager (MedicationManager.ts)
- Hooks: camelCase + use prefix (useToast.ts)
- Tipos: PascalCase (Patient, Medication)
- Constantes: UPPER_SNAKE_CASE

**Archivos**:
- Un componente por archivo
- Tests co-localizados (.test.ts)
- Exports centralizados (index.ts)

### Documentación

**Código**:
- JSDoc para funciones públicas
- Comentarios para lógica compleja
- README en cada módulo

**API**:
- Documentación completa en docs/API.md
- Ejemplos de uso
- Tipos TypeScript como documentación

## Testabilidad

### Estrategia de Pruebas

**Pirámide de Pruebas**:
```
        /\
       /  \  E2E (5%)
      /────\
     /      \  Integration (15%)
    /────────\
   /          \  Unit + PBT (80%)
  /────────────\
```

**Tipos de Pruebas**:

1. **Unitarias** (80%):
   - Funciones puras
   - Componentes aislados
   - Servicios con mocks

2. **Property-Based** (incluidas en 80%):
   - 36 propiedades de corrección
   - 100+ iteraciones por propiedad
   - Generadores personalizados

3. **Integración** (15%):
   - Flujos completos
   - Múltiples servicios
   - Interacción con almacenamiento

4. **E2E** (5%):
   - Flujos críticos de usuario
   - Navegación completa
   - Casos de uso reales

### Herramientas

- **Vitest**: Framework de pruebas
- **fast-check**: Property-based testing
- **Testing Library**: Pruebas de componentes
- **fake-indexeddb**: Mock de IndexedDB
- **Coverage v8**: Cobertura de código

### Cobertura

**Objetivos**:
- General: > 80%
- Validaciones críticas: 100%
- Managers: > 90%
- Servicios: > 85%
- Componentes: > 75%

## Despliegue

### Entornos

1. **Desarrollo**:
   - Local con Vite dev server
   - Hot Module Replacement
   - Source maps habilitados

2. **Staging**:
   - Build de producción
   - Datos de prueba
   - Monitoreo habilitado

3. **Producción**:
   - Build optimizado
   - CDN para assets
   - Monitoreo y alertas

### CI/CD

**Pipeline**:
```
1. Commit → GitHub
2. Lint + Type Check
3. Run Tests
4. Build
5. Deploy to Staging
6. E2E Tests
7. Deploy to Production
```

### Monitoreo

**Métricas**:
- Errores de JavaScript (Sentry)
- Performance (Web Vitals)
- Uso (Google Analytics)
- Uptime (Pingdom)

## Futuras Mejoras

### Corto Plazo (3 meses)

- [ ] Backend API RESTful
- [ ] Sincronización en tiempo real
- [ ] Notificaciones push nativas
- [ ] Modo offline mejorado

### Medio Plazo (6 meses)

- [ ] App móvil nativa (React Native)
- [ ] Integración con wearables
- [ ] IA para predicción de riesgos
- [ ] Reportes avanzados

### Largo Plazo (12 meses)

- [ ] Telemedicina integrada
- [ ] Marketplace de cuidadores
- [ ] Integración con sistemas hospitalarios
- [ ] Expansión internacional

---

**Última actualización**: 2026-02-13
**Versión**: 1.0.0
