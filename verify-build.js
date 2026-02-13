#!/usr/bin/env node

/**
 * Script de verificación pre-deployment
 * Verifica que todos los archivos necesarios estén presentes antes de desplegar
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_FILES = [
  'public/CNAME',
  'public/.nojekyll',
  'public/robots.txt',
  'public/sitemap.xml',
  '.github/workflows/deploy.yml',
  'vite.config.ts',
  'package.json'
];

const REQUIRED_IN_DIST = [
  'dist/CNAME',
  'dist/.nojekyll',
  'dist/index.html',
  'dist/app.html'
];

console.log('🔍 Verificando configuración de GitHub Pages...\n');

let hasErrors = false;

// Verificar archivos requeridos en el proyecto
console.log('📁 Verificando archivos del proyecto:');
REQUIRED_FILES.forEach(file => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  if (!exists) hasErrors = true;
});

// Verificar contenido de CNAME
console.log('\n📝 Verificando contenido de CNAME:');
try {
  const cnameContent = fs.readFileSync('public/CNAME', 'utf8').trim();
  if (cnameContent === 'cuidoamitata.cl') {
    console.log('✅ CNAME contiene: cuidoamitata.cl');
  } else {
    console.log(`❌ CNAME contiene: "${cnameContent}" (debería ser "cuidoamitata.cl")`);
    hasErrors = true;
  }
} catch (error) {
  console.log('❌ No se pudo leer CNAME');
  hasErrors = true;
}

// Verificar vite.config.ts
console.log('\n⚙️  Verificando vite.config.ts:');
try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  
  if (viteConfig.includes("base: '/'")) {
    console.log("✅ base: '/' configurado (correcto para dominio custom)");
  } else if (viteConfig.includes("base: '/CuidoAMiTata.cl/'")) {
    console.log("⚠️  base: '/CuidoAMiTata.cl/' (para GitHub Pages sin dominio custom)");
  } else {
    console.log("❌ base no encontrado o mal configurado");
    hasErrors = true;
  }
  
  if (viteConfig.includes("publicDir: 'public'")) {
    console.log("✅ publicDir: 'public' configurado");
  } else {
    console.log("❌ publicDir no configurado");
    hasErrors = true;
  }
} catch (error) {
  console.log('❌ No se pudo leer vite.config.ts');
  hasErrors = true;
}

// Verificar si existe dist/ (después del build)
console.log('\n📦 Verificando build (dist/):');
if (fs.existsSync('dist')) {
  console.log('✅ Directorio dist/ existe');
  
  REQUIRED_IN_DIST.forEach(file => {
    const exists = fs.existsSync(file);
    const status = exists ? '✅' : '⚠️ ';
    console.log(`${status} ${file}`);
  });
} else {
  console.log('⚠️  Directorio dist/ no existe (ejecuta "npm run build" primero)');
}

// Verificar package.json scripts
console.log('\n📜 Verificando scripts de package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'build:css'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ Script "${script}" existe`);
    } else {
      console.log(`❌ Script "${script}" no encontrado`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log('❌ No se pudo leer package.json');
  hasErrors = true;
}

// Resultado final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Se encontraron errores. Corrígelos antes de desplegar.');
  process.exit(1);
} else {
  console.log('✅ Todas las verificaciones pasaron correctamente.');
  console.log('\n💡 Siguiente paso:');
  console.log('   1. Ejecuta: npm run build');
  console.log('   2. Verifica que dist/ tenga todos los archivos');
  console.log('   3. Haz push a main para desplegar');
  process.exit(0);
}
