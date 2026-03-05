// .eslintrc.js
module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 2020,      // optional but recommended
    ecmaFeatures: { jsx: true },
  },

  env: {
    node: true,
    jest: true,
    es2021: true,           // now you get globals like Promise, etc.
  },

  plugins: [
    '@typescript-eslint',
  ],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',   // runs Prettier as an ESLint rule
  ],

  ignorePatterns: [
    '.eslintrc.js',          // you already had this
    'dist/',
    'node_modules/',
  ],

  rules: {
    // your custom overrides:
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // TS‑only overrides go here
      },
    },
  ],
};
