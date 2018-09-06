/**
 *
 * This allows us to configure webpack used internally by the vue cli build tool.
 *
 * More info: https://cli.vuejs.org/dev-guide/plugin-dev.html#cli-plugin
 *
 */

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
      .add('/spa')
      .end()
  })

  // Scope Vue JS loaders to /spa directory.
  api.chainWebpack(webpackConfigChain => {
    // Add the ability to require handlebars partials.
    webpackConfigChain.module
      .rule('js')
      .include
      .add('/spa')
      .end()
  })

  // Scope Clay JS loaders to /app directory.
  api.chainWebpack(webpackConfigChain => {
    // Add the ability to require handlebars partials.
    webpackConfigChain.module
      .rule('clayjs')
      .test(/\.js$/)
      .include
      .add('/app')
      .end()
      .exclude
      .add((filepath) => {
        // Don't transpile node_modules
        return /node_modules/.test(filepath)
      })
      .end()
      .use('clayjs')
      .loader('babel-loader')
      .options({
        presets: ['@babel/preset-env']
      })
  })
}
