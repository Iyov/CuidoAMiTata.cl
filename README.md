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

```
CuidoAMiTata.cl/
├── app.html              # Entrada SPA React
├── index.html            # Landing (se copia a public/ en build)
├── package.json, vite.config.ts, tsconfig.json, tailwind.config.js
│
├── src/
│   ├── main.tsx, App.tsx, index.css, constants.ts
│   ├── config/           # Supabase
│   ├── components/       # Button, Card, Input, Toast, ErrorBoundary, etc.
│   ├── contexts/        # ThemeContext (tema claro/oscuro)
│   ├── hooks/           # useToast, etc.
│   ├── screens/         # Pantallas (Auth, Medicamentos, Caídas, Piel, Nutrición, …)
│   ├── services/        # Auth, Storage, Validation, Notification, Sync + Managers
│   ├── types/           # enums, models, result, validation
│   ├── utils/           # indexedDB, localStorage, accessibility, performance
│   └── test/            # Setup Vitest
│
├── public/              # Estáticos (index.html, manifest, css, js, img, webfonts)
├── docs/                # Documentación en español (índice en docs/README.md)
├── css/                 # Tailwind (input.css → output.css)
├── .github/workflows/   # deploy.yml (GitHub Pages)
│
├── README.md, CONTRIBUTING.md, LICENSE
```

**Resumen**: `screens/` = pantallas por ruta; `services/` = lógica de negocio y managers; `types/` = modelos y enums.

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
