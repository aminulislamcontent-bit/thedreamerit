import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Bilingual copy intentionally uses quoted terms inside JSX text.
      'react/no-unescaped-entities': 'off',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'data/**', 'backups/**', 'uploads/**'] },
];
