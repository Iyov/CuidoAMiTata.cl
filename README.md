# CuidoAMiTata.cl 💚

Plataforma web profesional para el cuidado y atención de adultos mayores en Chile.

![Version](https://img.shields.io/badge/version-1.0.0-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38bdf8)

## 📋 Descripción

CuidoAMiTata.cl es una plataforma web moderna diseñada para conectar familias con servicios de cuidado profesional para adultos mayores. Ofrece herramientas tecnológicas que facilitan la gestión del cuidado, comunicación entre familiares y cuidadores, y seguimiento en tiempo real del bienestar de nuestros seres queridos.

## ✨ Características

### Funcionalidades
- 🌓 **Modo Claro/Oscuro** - Tema adaptable con preferencias guardadas
- 🌍 **Multilenguaje** - Soporte para Español e Inglés
- 📱 **Diseño Responsivo** - Optimizado para todos los dispositivos
- 💊 **Gestión de Medicación** - Sistema de alarmas y confirmación visual
- 📖 **Bitácora Diaria** - Registro completo de actividades y cuidados
- 👨‍👩‍👧‍👦 **Multi-Familiar** - Acceso compartido para toda la familia
- 🚨 **Botón de Pánico** - Alertas instantáneas en emergencias
- ⚡ **Rendimiento Optimizado** - CSS compilado y minificado

### SEO y Accesibilidad
- 🔍 **SEO Optimizado** - Meta tags completos, Schema.org structured data
- ♿ **Accesibilidad WCAG** - ARIA labels, alt text, navegación semántica
- 📊 **Rich Snippets** - 4 tipos de Schema.org (Organization, WebSite, Service, BreadcrumbList)
- 🌐 **Open Graph** - Optimizado para redes sociales (Facebook, Twitter, LinkedIn)
- 🗺️ **Sitemap XML** - Indexación optimizada para motores de búsqueda
- 🤖 **robots.txt** - Configuración para crawlers
- 📱 **PWA Ready** - Manifest.json para instalación en dispositivos móviles

## 🚀 Tecnologías

- **HTML5** - Estructura semántica
- **Tailwind CSS 3.x** - Framework CSS utility-first
- **JavaScript ES6+** - Funcionalidad moderna
- **Font Awesome 6.5.1** - Iconografía profesional
- **LocalStorage API** - Persistencia de preferencias

## 📦 Instalación

### Prerrequisitos

- Node.js 14.x o superior
- npm 6.x o superior

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Iyov/CuidoAMiTata.cl.git
cd CuidoAMiTata.cl
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Compilar CSS para producción**
```bash
npm run build:css
```

4. **Abrir en navegador**
- Abre `index.html` directamente en tu navegador
- O usa Live Server / cualquier servidor local

## 🛠️ Scripts Disponibles

```bash
# Compilar CSS para producción (minificado)
npm run build:css

# Modo desarrollo con auto-recarga del CSS
npm run watch:css
```

## 📁 Estructura del Proyecto

```
CuidoAMiTata.cl/
├── index.html                 # Página principal
├── css/
│   ├── input.css             # CSS fuente con directivas Tailwind
│   ├── output.css            # CSS compilado (generado)
│   ├── index.css             # Estilos personalizados
│   └── font-awesome_6.5.1_all.min.css
├── js/
│   └── index.js              # Lógica de la aplicación
├── img/
│   └── CuidoAMiTata_Logo_500.png
├── webfonts/                 # Fuentes de Font Awesome
├── robots.txt                # Configuración para crawlers
├── sitemap.xml               # Mapa del sitio para SEO
├── .htaccess                 # Configuración Apache (redirects, cache)
├── manifest.json             # PWA manifest
├── tailwind.config.js        # Configuración de Tailwind
├── package.json              # Dependencias del proyecto
├── README.md                 # Documentación
├── LICENSE                   # Licencia MIT
└── CONTRIBUTING.md           # Guía de contribución
```

## 🎨 Personalización

### Colores

Los colores principales se definen en `tailwind.config.js`:

```javascript
colors: {
  primary: '#10b981',        // Verde esmeralda
  'primary-dark': '#059669', // Verde oscuro
}
```

### Temas

El sitio soporta modo claro y oscuro. Por defecto inicia en modo oscuro. Los usuarios pueden cambiar entre temas y su preferencia se guarda en localStorage.

### Idiomas

Agregar nuevos idiomas editando el objeto `translations` en `js/index.js`:

```javascript
const translations = {
  es: { /* traducciones en español */ },
  en: { /* traducciones en inglés */ },
  // Agregar más idiomas aquí
}
```

## 🔍 SEO y Optimización

### Configuración Post-Despliegue

1. **Google Search Console**
   - Verificar propiedad en https://search.google.com/search-console
   - Enviar sitemap: `https://cuidoamitata.cl/sitemap.xml`
   - Solicitar indexación

2. **Validar Structured Data**
   - Rich Results Test: https://search.google.com/test/rich-results
   - Schema Validator: https://validator.schema.org

3. **Verificar Open Graph**
   - Facebook Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator

4. **Auditoría con Lighthouse**
   - Chrome DevTools (F12) → Lighthouse
   - Verificar scores de SEO, Accesibilidad, Performance

### Scores Esperados

| Categoría | Score |
|-----------|-------|
| SEO | 95-100 ✅ |
| Accesibilidad | 90-95 ✅ |
| Performance | 80-90 ✅ |
| Best Practices | 90-95 ✅ |

## 🌐 Despliegue

### GitHub Pages

1. Asegúrate de compilar el CSS:
```bash
npm run build:css
```

2. Commit y push de los cambios:
```bash
git add .
git commit -m "Build production CSS"
git push origin main
```

3. Configura GitHub Pages en Settings → Pages → Source: main branch

### Otros Servicios

El sitio es estático y puede desplegarse en:
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront
- Cualquier servidor web estático

**Nota**: Si usas Apache, el archivo `.htaccess` incluye configuraciones para:
- Redirección HTTPS
- Compresión GZIP
- Cache de navegador
- Headers de seguridad

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Changelog

### Version 1.0.0 (2026-02-10)
- ✅ Diseño responsivo completo
- ✅ Modo claro/oscuro con persistencia
- ✅ Multilenguaje (ES/EN)
- ✅ Tailwind CSS compilado para producción
- ✅ Optimización de rendimiento
- ✅ Esquema de colores verde profesional
- ✅ SEO completo con Schema.org structured data
- ✅ Accesibilidad WCAG con ARIA labels
- ✅ Open Graph para redes sociales
- ✅ Sitemap XML y robots.txt
- ✅ PWA manifest para instalación móvil

## 📧 Contacto

- **Email**: cuidoamitata@gmail.com
- **WhatsApp**: +56 9 8762 9765
- **Instagram**: [@CuidoAMiTata](https://instagram.com/CuidoAMiTata)
- **Facebook**: [CuidoAMiTata](https://facebook.com/CuidoAMiTata)
- **Website**: [https://cuidoamitata.cl](https://cuidoamitata.cl)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 💚 Agradecimientos

Desarrollado con amor para las familias chilenas que cuidan de sus seres queridos.

---

**© 2026 CuidoAMiTata.cl** - Tecnología al servicio del amor familiar
