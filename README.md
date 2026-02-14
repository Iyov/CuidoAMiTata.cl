# CuidoAMiTata.cl 💚

Aplicación de gestión de cuidados geriátricos basada en evidencia (directrices SEGG).

[![Versión](https://img.shields.io/badge/versión-1.0.0-emerald)](https://github.com/Iyov/CuidoAMiTata.cl)
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38bdf8)](https://tailwindcss.com/)

## Descripción

**CuidoAMiTata** es una aplicación web y móvil para cuidadores de adultos mayores. Incluye:

- 💊 Medicamentos (alertas, adherencia)
- 🚶 Prevención de caídas
- 🛏️ Integridad de piel (cambios posturales, UPP)
- 🍽️ Nutrición e hidratación
- 🚽 Incontinencia
- 💉 Polifarmacia
- 🤝 Cuidado ético
- 👥 Múltiples pacientes

Interfaz en **español**, **modo oscuro** por defecto, **offline** y **sincronización** con Supabase.

## Inicio rápido

### Requisitos

- Node.js 18+
- npm 9+
- (Opcional) Cuenta [Supabase](https://supabase.com) para autenticación

### Instalación

```bash
git clone https://github.com/Iyov/CuidoAMiTata.cl.git
cd CuidoAMiTata.cl
npm install
```

### Configuración (opcional)

Para login real, crea `.env.local` en la raíz:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Sin estas variables la app carga igual; el inicio de sesión fallará hasta configurar Supabase. Ver [docs/configuracion-supabase.md](docs/configuracion-supabase.md).

### Ejecutar

```bash
npm run dev
```

- Landing: `http://localhost:5173/`
- App: `http://localhost:5173/app.html`

## Estructura del proyecto

Estructura de directorios y archivos principales para orientarse en el código:

```
CuidoAMiTata.cl/
├── app.html                  # Entrada de la app React (SPA)
├── index.html                # Landing page (raíz, se copia a public/)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
│
├── src/
│   ├── main.tsx               # Punto de entrada (monta React + ErrorBoundary)
│   ├── App.tsx                # Componente raíz, rutas, auth
│   ├── index.css              # Estilos globales / Tailwind
│   ├── constants.ts           # Constantes de la aplicación
│   ├── vite-env.d.ts          # Tipos de entorno Vite
│   │
│   ├── config/
│   │   └── supabase.ts        # Cliente y configuración Supabase
│   │
│   ├── components/            # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Toast.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── ConfirmationModal.tsx
│   │   ├── FeedbackAlert.tsx
│   │   └── index.ts
│   │
│   ├── contexts/
│   │   └── ThemeContext.tsx   # Tema claro/oscuro
│   │
│   ├── hooks/
│   │   ├── useToast.ts
│   │   └── index.ts
│   │
│   ├── screens/               # Pantallas de la aplicación
│   │   ├── AuthScreen.tsx
│   │   ├── MedicationListScreen.tsx
│   │   ├── MedicationFormScreen.tsx
│   │   ├── MedicationConfirmScreen.tsx
│   │   ├── FallPreventionScreen.tsx
│   │   ├── FallPreventionChecklistScreen.tsx
│   │   ├── FallIncidentScreen.tsx
│   │   ├── FallRiskAlertsScreen.tsx
│   │   ├── SkinIntegrityScreen.tsx
│   │   ├── PosturalChangeScreen.tsx
│   │   ├── BedElevationScreen.tsx
│   │   ├── PressureUlcerScreen.tsx
│   │   ├── NutritionScreen.tsx
│   │   ├── MealPlanScreen.tsx
│   │   ├── MealIntakeScreen.tsx
│   │   ├── HydrationTrackingScreen.tsx
│   │   ├── IncontinenceScreen.tsx
│   │   ├── IncontinenceEpisodeScreen.tsx
│   │   ├── IncontinencePatternsScreen.tsx
│   │   ├── BathroomVisitScreen.tsx
│   │   ├── PolypharmacyScreen.tsx
│   │   ├── SIGREMapScreen.tsx
│   │   ├── EthicalCareScreen.tsx
│   │   ├── PatientListScreen.tsx
│   │   ├── PatientFormScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── HistoryExportScreen.tsx
│   │   ├── NotificationSettingsScreen.tsx
│   │   ├── UserPreferencesScreen.tsx
│   │   └── index.ts
│   │
│   ├── services/              # Lógica de negocio y servicios
│   │   ├── AuthService.ts
│   │   ├── SupabaseAuthService.ts
│   │   ├── StorageService.ts
│   │   ├── ValidationService.ts
│   │   ├── NotificationService.ts
│   │   ├── DataSyncService.ts
│   │   ├── HistoryService.ts
│   │   ├── IntegrationService.ts
│   │   ├── MedicationManager.ts
│   │   ├── FallPreventionManager.ts
│   │   ├── SkinIntegrityManager.ts
│   │   ├── NutritionManager.ts
│   │   ├── IncontinenceManager.ts
│   │   ├── PolypharmacyManager.ts
│   │   ├── EthicalCareModule.ts
│   │   ├── PatientManager.ts
│   │   └── index.ts
│   │
│   ├── types/                 # Tipos e interfaces TypeScript
│   │   ├── enums.ts
│   │   ├── models.ts
│   │   ├── result.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── indexedDB.ts       # Wrapper IndexedDB
│   │   ├── localStorage.ts
│   │   ├── accessibility.ts
│   │   ├── performance.ts
│   │   └── index.ts
│   │
│   └── test/
│       └── setup.ts           # Configuración Vitest
│
├── public/                    # Archivos estáticos (copiados a dist/)
│   ├── index.html             # Landing (copia desde raíz en prebuild)
│   ├── manifest.json
│   ├── CNAME, .nojekyll, robots.txt, sitemap.xml
│   ├── css/
│   ├── js/
│   ├── img/
│   └── webfonts/
│
├── docs/                      # Documentación (español)
│   ├── README.md              # Índice de documentación
│   ├── guia-usuario.md
│   ├── configuracion-supabase.md
│   ├── configuracion-proyecto.md
│   ├── despliegue-github-pages.md
│   ├── despliegue.md
│   ├── lista-verificacion-produccion.md
│   ├── arquitectura.md
│   ├── api.md
│   └── solucion-problemas-produccion.md
│
├── css/                       # Fuente Tailwind (input.css → output.css)
├── .github/workflows/
│   └── deploy.yml            # Despliegue GitHub Pages
│
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

- **Pantallas** (`src/screens/`): cada pantalla corresponde a una ruta de la app (medicamentos, caídas, piel, nutrición, etc.).
- **Servicios** (`src/services/`): autenticación, almacenamiento, validación, notificaciones, sincronización y managers por dominio.
- **Tipos** (`src/types/`): enumeraciones, modelos y tipo `Result` para errores.

## Scripts

| Comando | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm test` | Pruebas |
| `npm run build:css` | Compilar Tailwind CSS |
| `npm run lint` | Linter |
| `npm run type-check` | Verificar tipos TypeScript |

## Documentación

Toda la documentación está en la carpeta **[docs/](docs/)**:

| Documento | Contenido |
|-----------|-----------|
| [docs/README.md](docs/README.md) | Índice de la documentación |
| [docs/guia-usuario.md](docs/guia-usuario.md) | Manual de uso |
| [docs/configuracion-supabase.md](docs/configuracion-supabase.md) | Configurar Supabase |
| [docs/configuracion-proyecto.md](docs/configuracion-proyecto.md) | Configuración del proyecto |
| [docs/despliegue-github-pages.md](docs/despliegue-github-pages.md) | Despliegue en GitHub Pages |
| [docs/despliegue.md](docs/despliegue.md) | Opciones de despliegue |
| [docs/lista-verificacion-produccion.md](docs/lista-verificacion-produccion.md) | Checklist pre-despliegue |
| [docs/arquitectura.md](docs/arquitectura.md) | Arquitectura del sistema |
| [docs/api.md](docs/api.md) | Referencia de servicios y componentes |
| [docs/solucion-problemas-produccion.md](docs/solucion-problemas-produccion.md) | Problemas frecuentes en producción |

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para guía de contribución.

## Licencia

[MIT](LICENSE). © 2026 CuidoAMiTata.cl

## Contacto

- **Web**: [cuidoamitata.cl](https://cuidoamitata.cl)
- **Email**: cuidoamitata@gmail.com
- **WhatsApp**: +56 9 8762 9765
