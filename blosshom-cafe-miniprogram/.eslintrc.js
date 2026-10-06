module.exports = {
  root: true,
  env: { browser: true, node: true, jest: true, es6: true },
  parserOptions: { parser: '@babel/eslint-parser', requireConfigFile: false, sourceType: 'module' },
  plugins: ['vue'],
  extends: ['eslint:recommended', 'plugin:vue/recommended'],
  globals: { uni: 'readonly', wx: 'readonly' },
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/html-self-closing': 'off',
    'vue/require-default-prop': 'off',
    'vue/no-v-html': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }]
  }
}
