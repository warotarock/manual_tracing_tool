module.exports = {
  'root': true,
  'env': {
    'es2020': true
  },
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'project': './src/tsconfig.json'
  },
  'plugins': [
    '@typescript-eslint'
  ],
  'extends': [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  'rules': {
    '@typescript-eslint/semi': ['error', 'never'],
    '@typescript-eslint/no-extra-semi': ['error'],
    '@typescript-eslint/explicit-function-return-type': ['off'],
    '@typescript-eslint/explicit-module-boundary-types': ['off'],
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-inferrable-types': ['off']
  }
}
