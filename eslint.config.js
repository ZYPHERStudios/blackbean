import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default tseslint.config(
  {
    ignores: [
      './dist/**',
      './build/**',
      './store/**',
      './node_modules/**'
    ]
  },
  {
    files: ['./src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      '@stylistic': stylistic,
      'simple-import-sort': simpleImportSort
    },
    rules: {
      '@stylistic/semi': ['error', 'always'],
      'simple-import-sort/imports': ['error', {
        groups: [
          ['^(node:|fs|path|crypto|url|os|events|http|https|stream|util)(/|$)'],
          ['^@?\\w'],
          ['^(@src|@app|@core)(/|$)'],
          ['^\\.\\.(?!/?$)'],
          ['^\\.(?!/?$)'],
          ['^\\u0000']
        ]
      }]
    }
  },
  {
    files: ['./src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@stylistic': stylistic,
      'simple-import-sort': simpleImportSort
    },
    extends: [...tseslint.configs.recommended],
    rules: {
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'semi', requireLast: true },
        singleline: { delimiter: 'semi', requireLast: true }
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'simple-import-sort/imports': ['error', {
        groups: [
          ['^(node:|fs|path|crypto|url|os|events|http|https|stream|util)(/|$)'],
          ['^@?\\w'],
          ['^(@src|@app|@core)(/|$)'],
          ['^\\.\\.(?!/?$)'],
          ['^\\.(?!/?$)'],
          ['^\\u0000']
        ]
      }]
    }
  }
)
