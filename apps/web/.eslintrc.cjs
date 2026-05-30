/** ESLint config for the React frontend. */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.3' } },
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs', 'vite.config.ts', 'tailwind.config.ts'],
  rules: {
    ...require('eslint-plugin-react-hooks').configs.recommended.rules,
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
};
