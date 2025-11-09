import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Reglas básicas de calidad de código
      'no-unused-vars': 'warn',
      'no-console': 'off', // Permitir console.log en desarrollo
      'prefer-const': 'error',
      'no-var': 'error',

      // Reglas específicas de React (si se instala eslint-plugin-react)
      // 'react/prop-types': 'off', // Desactivado por ahora

      // Reglas de estilo
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  {
    files: ['**/*.css'],
    languageOptions: {
      parser: {
        parse: (code) => ({
          type: 'Program',
          body: [],
          sourceType: 'module',
        }),
      },
    },
    rules: {
      // Desactivar reglas que no aplican a CSS
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
];