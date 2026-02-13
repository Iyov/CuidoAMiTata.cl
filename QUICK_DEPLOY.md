# 🚀 Guía Rápida de Despliegue

## Antes de Desplegar (Primera Vez)

### 1. Configurar GitHub Secrets
```
Settings > Secrets and variables > Actions > New repository secret
```

Agregar:
- `VITE_SUPABASE_URL` = tu URL de Supabase
- `VITE_SUPABASE_ANON_KEY` = tu clave anónima

### 2. Configurar GitHub Pages
```
Settings > Pages
```

- Source: **GitHub Actions**
- Custom domain: **cuidoamitata.cl**
- Enforce HTTPS: **✅**

### 3. Configurar DNS (en tu proveedor de dominio)
```
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
CNAME www  iyov.github.io
```

## Desplegar

### Opción 1: Verificar y Desplegar
```bash
npm run verify          # Verifica configuración
npm run predeploy       # Build completo con verificación
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Opción 2: Despliegue Rápido
```bash
git add .
git commit -m "Update"
git push origin main
```

El workflow se ejecuta automáticamente en cada push a `main`.

## Verificar Despliegue

1. Ve a **Actions** en GitHub
2. Espera 2-3 minutos
3. Visita https://cuidoamitata.cl

## Comandos Útiles

```bash
# Verificar configuración
npm run verify

# Build local
npm run build:css
npm run build

# Preview local
npm run preview

# Ver contenido de dist
ls dist/
```

## Checklist Rápido

- [ ] Secrets configurados en GitHub
- [ ] GitHub Pages configurado (Source: GitHub Actions)
- [ ] DNS configurado (esperar 10-30 min)
- [ ] Push a main realizado
- [ ] Workflow completado sin errores
- [ ] Sitio accesible en https://cuidoamitata.cl

## Solución Rápida de Problemas

### Build falla
```bash
npm run verify
npm run build
```

### Dominio no funciona
```bash
# Verificar DNS
nslookup cuidoamitata.cl

# Verificar CNAME
cat public/CNAME
```

### Assets no cargan
Verificar que `vite.config.ts` tenga:
```typescript
base: '/',  // Para dominio custom
```

---

**¿Necesitas más ayuda?** Ver `DEPLOY_GITHUB_PAGES.md` para guía completa.
