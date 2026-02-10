# CuidoAMiTata.cl

Plataforma web para el cuidado y atención de adultos mayores en Chile.

## Descripción

CuidoAMiTata.cl es un sitio web diseñado para conectar familias con servicios de cuidado profesional para adultos mayores.

## Tecnologías

- HTML5
- CSS3 (Tailwind CSS)
- JavaScript

## Instalación y Desarrollo

1. Clona este repositorio
```bash
git clone https://github.com/Iyov/CuidoAMiTata.cl.git
cd CuidoAMiTata.cl
```

2. Instala las dependencias
```bash
npm install
```

3. Compila el CSS para producción
```bash
npm run build:css
```

4. Para desarrollo con auto-recarga del CSS
```bash
npm run watch:css
```

5. Abre `index.html` en tu navegador o usa Live Server

## Scripts Disponibles

- `npm run build:css` - Compila y minifica el CSS de Tailwind para producción
- `npm run watch:css` - Modo desarrollo con auto-recarga del CSS

## Estructura del Proyecto

```
CuidoAMiTata.cl/
├── index.html
├── css/
│   ├── input.css          # CSS fuente con directivas de Tailwind
│   ├── output.css         # CSS compilado (generado automáticamente)
│   ├── index.css          # CSS personalizado adicional
│   └── font-awesome_6.5.1_all.min.css
├── js/
│   └── index.js
├── assets/
│   └── images/
├── tailwind.config.js     # Configuración de Tailwind
└── README.md
```

## Licencia

© 2026 CuidoAMiTata.cl - Todos los derechos reservados
