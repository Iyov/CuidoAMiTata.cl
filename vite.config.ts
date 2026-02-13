import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
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
        main: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app.html'),
      },
      output: {
        // Code splitting para optimizar carga inicial
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'services': [
            './src/services/StorageService.ts',
            './src/services/ValidationService.ts',
            './src/services/NotificationService.ts',
          ],
          'managers': [
            './src/services/MedicationManager.ts',
            './src/services/FallPreventionManager.ts',
            './src/services/SkinIntegrityManager.ts',
          ],
        },
      },
    },
    // Optimizar tamaño de chunks
    chunkSizeWarningLimit: 1000,
  },
  // Optimizaciones de desarrollo
  server: {
    hmr: {
      overlay: true,
    },
  },
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
