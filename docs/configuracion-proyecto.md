# Configuración del Proyecto CuidoAMiTata

Documento de referencia sobre la estructura y configuración técnica del proyecto.

## Estructura de directorios (TypeScript)

```
src/
├── types/              # Tipos TypeScript
│   ├── enums.ts        # Enumeraciones del sistema
│   ├── models.ts       # Interfaces de modelos
│   ├── result.ts       # Tipo Result (manejo de errores)
│   └── index.ts
├── utils/               # Utilidades
│   ├── indexedDB.ts    # Wrapper IndexedDB
│   ├── localStorage.ts # Wrapper LocalStorage
│   └── index.ts
├── test/                # Configuración de pruebas
│   └── setup.ts
├── constants.ts         # Constantes de la aplicación
└── README.md
```

## Configuración

- **TypeScript** (`tsconfig.json`): ES2020, strict, path aliases.
- **ESLint** (`.eslintrc.json`): TypeScript, React, React Hooks, Prettier.
- **Prettier** (`.prettierrc.json`): comillas simples, punto y coma, 100 caracteres, 2 espacios.
- **Vite** (`vite.config.ts`): React, aliases, Vitest, cobertura.

## Dependencias principales

- **Producción**: React 18, React Router 6, Redux Toolkit, Supabase.
- **Desarrollo**: TypeScript 5.7, Vite 6, Vitest, fast-check, ESLint, Prettier, Tailwind.

## IndexedDB (`src/utils/indexedDB.ts`)

Stores: `patients`, `medications`, `careEvents`, `notifications`, `syncQueue`.  
Funciones: `initDB`, `getById`, `getAll`, `getByIndex`, `put`, `putMany`, `deleteById`, `clear`, `count`.

## LocalStorage (`src/utils/localStorage.ts`)

Funciones: `setItem`, `getItem`, `removeItem`, `clear`, `hasItem`, `getAllKeys`, `getStorageSize`.  
Claves típicas: `theme`, `language`, `user_preferences`, `selected_patient`, `auth_token`, `last_sync`, `notification_preferences`.

## Tipos

- **Enums**: ErrorCode, Priority, NotificationStatus, CareEventType, SyncStatus, Theme, UserRole, etc.
- **Modelos**: Patient, Medication, MedicationEvent, Notification, FallIncident, PressureUlcer, NutritionEvent, etc.
- **Result&lt;T, E&gt;**: Ok/Err, isOk/isErr, unwrap, map, mapErr.

## Scripts NPM

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm test` | Pruebas |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run test:coverage` | Cobertura |
| `npm run lint` / `lint:fix` | Linter |
| `npm run format` / `format:check` | Formato Prettier |
| `npm run type-check` | Verificación TypeScript |
| `npm run build:css` / `watch:css` | Tailwind CSS |

## Verificación

```bash
npm run type-check
npm test
npm run test:coverage
npm run format:check
npm run lint
```

[Volver al índice](README.md)
