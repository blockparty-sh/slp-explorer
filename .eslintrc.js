module.exports = {
  'env': {
    'browser': true,
    'es6': true,
  },
  'extends': [
    'google',
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
  },
  'rules': {
    'indent': 'off',
    'camelcase': 'off',
    'max-len': 'off',
    'no-invalid-this': 'off',
    'key-spacing': 'off',
    'no-multi-spaces': 'off',
    'object-curly-spacing': 'off',
  },
};
