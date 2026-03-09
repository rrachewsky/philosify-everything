import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  // Base recommended rules
  js.configs.recommended,

  // React recommended (flat config) - includes jsx-uses-vars for no-unused-vars compatibility
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],

  // Configure for React files
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        indexedDB: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        URLSearchParams: 'readonly',
        CustomEvent: 'readonly',
        URL: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Audio: 'readonly',
        Notification: 'readonly',
        AbortController: 'readonly',
        CSS: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',

        // Node/build globals
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      // React rules (override recommended)
      'react/prop-types': 'off', // Using TypeScript-like patterns

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Prettier compatibility (disables conflicting rules)
  prettier,

  // Ignore patterns
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.vite/',
      '.cursor/',
      'public/',
      '*.config.js',
      'vite.config.js',
      'vitest.config.js',
    ],
  },
];
