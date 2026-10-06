const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  productionSourceMap: false,
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin([
        {
          from: path.resolve(__dirname, 'cloudfunctions'),
          to: 'cloudfunctions',
          ignore: ['**/node_modules/**']
        }
      ])
    ]
  }
}
