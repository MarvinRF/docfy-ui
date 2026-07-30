import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist', 'coverage'],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Flags 2 pre-existing, idiomatic "reset state at the top of a fetch
      // effect" call sites (use-openapi-spec.ts, ResponseViewer.tsx) — a real
      // rule, but fixing it is a behavior change out of scope for adding
      // lint tooling. Left as a follow-up.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // shadcn/ui convention: these files export both the component and small
    // constants/sub-components from the same module by design.
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  eslintPluginPrettier,
);
