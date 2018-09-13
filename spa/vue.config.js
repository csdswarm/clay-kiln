/**
 *
 * This is the simple Vue configuration file.
 * See: https://cli.vuejs.org/guide/webpack.html#simple-configuration
 * NOTE: Most Vue webpack configuration should occur in ./config/webpack/webpackConfigPlugin.js
 *
 */

const path = require('path')

module.exports = {

  // Output the built files into clay repo's public folder
  outputDir: path.relative(__dirname, '../app/public/dist'),

  // Don't generate an index.html in outputDir
  chainWebpack: config => {
    config.plugins.delete('html')
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')
  }
}
