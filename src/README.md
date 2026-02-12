# CuidoAMiTata - Estructura del Proyecto

## Estructura de Directorios

```
src/
├── types/              # Definiciones de tipos TypeScript
│   ├── enums.ts       # Enumeraciones del sistema
│   ├── models.ts      # Interfaces de modelos de datos
│   ├── result.ts      # Tipo Result para manejo de errores
│   └── index.ts       # Exportaciones centralizadas
│
├── utils/             # Utilidades y helpers
│   ├── indexedDB.ts   # Wrapper de IndexedDB
│   ├── localStorage.ts # Wrapper de LocalStorage
│   └── index.ts       # Exportaciones centralizadas
│
├── services/          # Servicios de infraestructura
│   ├── storage/       # Servicio de almacenamiento con cifrado
│   ├── validation/    # Servicio de validación
│   ├── notification/  # Servicio de notificaciones
│   ├── auth/          # Servicio de autenticación
│   ├── sync/          # Servicio de sincronización
│   └── export/        # Servicio de exportación
│
├── managers/          # Gestores de lógica de negocio
│   ├── medication/    # Gestor de medicamentos
│   ├── fallPrevention/ # Gestor de prevención de caídas
│   ├── skinIntegrity/ # Gestor de integridad de piel
│   ├── nutrition/     # Gestor de nutrición
│   ├── incontinence/  # Gestor de incontinencia
│   ├── polypharmacy/  # Gestor de polifarmacia
│   └── ethicalCare/   # Módulo de cuidado ético
│
├── components/        # Componentes React
│   ├── common/        # Componentes comunes reutilizables
│   ├── layout/        # Componentes de layout
│   ├── medication/    # Componentes de medicación
│   ├── fallPrevention/ # Componentes de prevención de caídas
│   ├── skinIntegrity/ # Componentes de integridad de piel
│   ├── nutrition/     # Componentes de nutrición
│   ├── incontinence/  # Componentes de incontinencia
│   ├── polypharmacy/  # Componentes de polifarmacia
│   └── ethicalCare/   # Componentes de cuidado ético
│
├── store/             # Estado global (Redux)
│   ├── slices/        # Redux slices
│   └── store.ts       # Configuración del store
│
├── hooks/             # Custom React hooks
│
├── test/              # Configuración y utilidades de pruebas
│   └── setup.ts       # Setup de Vitest
│
├── App.tsx            # Componente raíz de la aplicación
└── main.tsx           # Punto de entrada
```

## Convenciones

### Nomenclatura
- **Archivos**: camelCase para archivos TypeScript (e.g., `medicationManager.ts`)
- **Componentes**: PascalCase para componentes React (e.g., `MedicationList.tsx`)
- **Tipos**: PascalCase para interfaces y tipos (e.g., `Patient`, `MedicationEvent`)
- **Enums**: PascalCase para enums (e.g., `ErrorCode`, `Priority`)
- **Constantes**: UPPER_SNAKE_CASE para constantes (e.g., `DB_NAME`, `STORAGE_KEYS`)

### Organización de Código
- Cada manager/service debe tener su propia carpeta con:
  - `index.ts` - Implementación principal
  - `types.ts` - Tipos específicos (si es necesario)
  - `*.test.ts` - Pruebas unitarias
  - `*.property.test.ts` - Pruebas basadas en propiedades

### Importaciones
- Usar alias de path configurados en `vite.config.ts`:
  - `@/` - Raíz de src
  - `@types/` - Tipos
  - `@utils/` - Utilidades
  - `@services/` - Servicios
  - `@managers/` - Gestores
  - `@components/` - Componentes

### Manejo de Errores
- Usar el tipo `Result<T, E>` para operaciones que pueden fallar
- Usar códigos de error del enum `ErrorCode`
- Mensajes de error siempre en español

### Pruebas
- Pruebas unitarias: `*.test.ts`
- Pruebas de propiedades: `*.property.test.ts`
- Mínimo 100 iteraciones para pruebas de propiedades
- Formato de etiqueta: `Feature: cuido-a-mi-tata, Property {número}: {texto}`

## Tecnologías

- **React 18** - Framework de UI
- **TypeScript 5** - Lenguaje tipado
- **Redux Toolkit** - Gestión de estado
- **Vite** - Build tool y dev server
- **Vitest** - Framework de pruebas
- **fast-check** - Property-based testing
- **IndexedDB** - Almacenamiento offline
- **TailwindCSS** - Estilos (ya configurado)

## Comandos

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo
npm run watch:css        # Observa cambios en CSS

# Build
npm run build            # Compila para producción
npm run preview          # Preview del build

# Pruebas
npm test                 # Ejecuta pruebas una vez
npm run test:watch       # Ejecuta pruebas en modo watch
npm run test:coverage    # Genera reporte de cobertura

# Calidad de código
npm run lint             # Verifica código con ESLint
npm run lint:fix         # Corrige problemas automáticamente
npm run format           # Formatea código con Prettier
npm run format:check     # Verifica formato
npm run type-check       # Verifica tipos TypeScript
```

## Próximos Pasos

1. Instalar dependencias: `npm install`
2. Implementar servicios fundamentales (Storage, Validation, Notification)
3. Implementar gestores de lógica de negocio
4. Crear componentes de UI
5. Integrar todo el sistema
