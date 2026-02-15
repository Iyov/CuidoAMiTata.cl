import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  // Ignorar archivos
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      'verify-build.js',
    ],
  },

  // Configuración base de JavaScript
  js.configs.recommended,

  // Configuración para archivos TypeScript y React
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
    },
    rules: {
      // Reglas recomendadas de TypeScript
      ...typescript.configs.recommended.rules,

      // Reglas recomendadas de React
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Reglas personalizadas
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn', // Cambiar a warning en lugar de error
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'warn', // Cambiar a warning
      'no-undef': 'off', // TypeScript ya maneja esto
      'no-console': 'off', // Permitir console.log en desarrollo
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Permitir reglas más laxas en archivos de test para evitar fallos por advertencias (CI)
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**', 'test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
