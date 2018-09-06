/**
 *
 * This allows us to configure webpack used internally by the vue cli build tool.
 *
 * More info: https://cli.vuejs.org/dev-guide/plugin-dev.html#cli-plugin
 *
 */

// Require Dependencies
const path = require('path')

module.exports = (api, projectOptions) => {

  // Add handlebars partials loading support.
  api.chainWebpack(webpackConfigChain => {
    // Add the ability to require handlebars partials.
    webpackConfigChain.module
      .rule('handlebars') // Tag rule with name 'handlebars' for easy future configuration.
      .test(/(\.hbs|\.handlebars)$/) // support .hbs and .handlebars files as both extensions are used in clay.
      .use('handlebars') // Tag the loader with the name 'handlebars' for easy future configuration.
      .loader('handlebars-template-loader')
      .options({
        attributes: []
      })
  })

  // Scope SPA linting rules to /spa directory only.
  api.chainWebpack(webpackConfigChain => {
    webpackConfigChain.module
      .rule('eslint')
      .include
      .add(path.resolve(__dirname, '../../../spa'))
      .end()
  })

  // Scope Vue JS loaders to /spa directory.
  api.chainWebpack(webpackConfigChain => {
    webpackConfigChain.module
      .rule('js')
      .include
      .add(path.resolve(__dirname, '../../../spa'))
      .end()
  })

  // Scope Clay JS loaders to /app directory.
  api.chainWebpack(webpackConfigChain => {
    webpackConfigChain.module
      .rule('clayjs') // Tag rule with name 'clayjs' for easy future configuration.
      .test(/\.js$/)
      .include
      .add(path.resolve(__dirname, '../../../app'))
      .end()
      .exclude
      .add((filepath) => {
        // Don't transpile node_modules
        return /node_modules/.test(filepath)
      })
      .end()
      .use('clayjs') // Tag the loader with the name 'clayjs' for easy future configuration.
      .loader('babel-loader')
      .options({
        presets: ['@babel/preset-env']
      })
  })

  // Scope Vue SVG loaders to /spa directory.
  api.chainWebpack(webpackConfigChain => {
    webpackConfigChain.module
      .rule('svg')
      .include
      .add(path.resolve(__dirname, '../../../spa'))
      .end()
  })

  // Scope Clay SVG loaders to /app directory.
  api.chainWebpack(webpackConfigChain => {
    webpackConfigChain.module
      .rule('claysvg') // Tag rule with name 'claysvg' for easy future configuration.
      .test(/\.svg$/)
      .include
      .add(path.resolve(__dirname, '../../../app'))
      .end()
      .exclude
      .add((filepath) => {
        // Don't apply to anything in node_modules.
        return /node_modules/.test(filepath)
      })
      .end()
      .use('claysvg') // Tag the loader with the name 'claysvg' for easy future configuration.
      .loader('raw-loader')
  })
}
