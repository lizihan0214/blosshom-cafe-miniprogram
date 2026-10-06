const path = require('path')
const util = require('util')
const moduleAlias = require('module-alias')

// The Vue 2-era uni-app toolchain still calls util type helpers removed by
// current Node releases. Keep the compatibility shim isolated to build time.
util.isArray = util.isArray || Array.isArray
util.isRegExp = util.isRegExp || (value => value instanceof RegExp)

// DCloud's Vue 2 compiler ships a patched component compiler inside the CLI
// plugin. npm's flat resolution otherwise picks Vue CLI's unpatched copy.
moduleAlias.addAlias(
  '@vue/component-compiler-utils',
  path.resolve(__dirname, '../node_modules/@dcloudio/vue-cli-plugin-uni/packages/@vue/component-compiler-utils')
)
