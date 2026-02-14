import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path para GitHub Pages
  // Como usas dominio custom (cuidoamitata.cl), usa '/'
  base: '/',
  
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@managers': path.resolve(__dirname, './src/managers'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  build: {
    // Optimizaciones de rendimiento
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, 'app.html'),
      },
      output: {
        // Dejar que Vite maneje el code splitting automáticamente
        manualChunks: undefined,
      },
    },
    // Optimizar tamaño de chunks
    chunkSizeWarningLimit: 1000,
    // Copiar archivos estáticos necesarios para GitHub Pages
    copyPublicDir: true,
  },
  // Directorio público para archivos estáticos
  publicDir: 'public',
  // Optimizaciones de desarrollo
  server: {
    hmr: {
      overlay: true,
    },
  },
  // @ts-expect-error - Vitest config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 60000, // 60 segundos para pruebas basadas en propiedades
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
        'dist/',
      ],
    },
  },
});
