module.exports = {
  root: true,
  extends: ['expo', 'eslint:recommended'],
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // Allow console.log for development
    'no-console': 'off',
    
    // Allow unused vars as warnings
    'no-unused-vars': ['warn'],
    
    // React/JSX rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    
    // General formatting
    'no-trailing-spaces': 'warn',
    'comma-dangle': 'off',
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single', { 'avoidEscape': true }],
    
    // Allow any type usage
    'no-undef': 'off', // TypeScript handles this
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'web-build/',
    '*.config.js',
    '*.config.ts',
    '.eslintrc.js',
    '*.apk',
    'assets/',
  ],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'expo',
        'eslint:recommended',
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn'],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'no-unused-vars': 'off', // Let TypeScript handle this
      },
    },
  ],
};
