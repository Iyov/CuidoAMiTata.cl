# Guía de Contribución

¡Gracias por tu interés en contribuir a CuidoAMiTata.cl! 💚

## Cómo Contribuir

### Reportar Bugs

Si encuentras un bug, por favor abre un issue con:
- Descripción clara del problema
- Pasos para reproducirlo
- Comportamiento esperado vs actual
- Screenshots si es aplicable
- Información del navegador/dispositivo

### Sugerir Mejoras

Para sugerir nuevas características:
1. Verifica que no exista un issue similar
2. Abre un nuevo issue describiendo la mejora
3. Explica por qué sería útil
4. Proporciona ejemplos de uso si es posible

### Pull Requests

1. **Fork el repositorio**
2. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feature/mi-nueva-caracteristica
   ```

3. **Realiza tus cambios**:
   - Sigue las convenciones de código existentes
   - Compila el CSS si modificas estilos: `npm run build:css`
   - Prueba en diferentes navegadores y dispositivos

4. **Commit tus cambios**:
   ```bash
   git commit -m "feat: descripción clara del cambio"
   ```
   
   Usa prefijos convencionales:
   - `feat:` - Nueva característica
   - `fix:` - Corrección de bug
   - `docs:` - Cambios en documentación
   - `style:` - Cambios de formato (no afectan código)
   - `refactor:` - Refactorización de código
   - `test:` - Agregar o modificar tests
   - `chore:` - Tareas de mantenimiento

5. **Push a tu fork**:
   ```bash
   git push origin feature/mi-nueva-caracteristica
   ```

6. **Abre un Pull Request** con:
   - Título descriptivo
   - Descripción detallada de los cambios
   - Referencias a issues relacionados
   - Screenshots si hay cambios visuales

## Estándares de Código

### HTML
- Usa HTML5 semántico
- Mantén la indentación consistente (4 espacios)
- Agrega atributos `alt` a todas las imágenes
- Usa `data-key` para textos traducibles

### CSS/Tailwind
- Usa clases de Tailwind cuando sea posible
- CSS personalizado solo en `css/input.css`
- Sigue el patrón de colores existente (emerald)
- Mantén el diseño responsivo

### JavaScript
- Usa ES6+ features
- No uses `console.log` en producción
- Comenta código complejo
- Mantén funciones pequeñas y enfocadas
- Usa nombres descriptivos para variables

### Commits
- Mensajes en español o inglés
- Primera línea: resumen corto (max 50 caracteres)
- Cuerpo: explicación detallada si es necesario
- Referencias a issues: `Closes #123`

## Proceso de Revisión

1. Un mantenedor revisará tu PR
2. Puede solicitar cambios o mejoras
3. Una vez aprobado, se hará merge
4. Tu contribución aparecerá en el changelog

## Configuración de Desarrollo

```bash
# Clonar el repo
git clone https://github.com/Iyov/CuidoAMiTata.cl.git
cd CuidoAMiTata.cl

# Instalar dependencias
npm install

# Modo desarrollo (auto-recarga CSS)
npm run watch:css

# Compilar para producción
npm run build:css
```

## Preguntas

Si tienes dudas, puedes:
- Abrir un issue con la etiqueta `question`
- Contactar por email: cuidoamitata@gmail.com

## Código de Conducta

- Sé respetuoso y profesional
- Acepta críticas constructivas
- Enfócate en lo mejor para el proyecto
- Ayuda a otros contribuidores

¡Gracias por hacer de CuidoAMiTata.cl un mejor proyecto! 💚
