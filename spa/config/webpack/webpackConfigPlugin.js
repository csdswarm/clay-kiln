/**
 *
 * This allows us to configure webpack used internally by the vue cli build tool.
 *
 * More info: https://cli.vuejs.org/dev-guide/plugin-dev.html#cli-plugin
 *
 */

module.exports = (api, projectOptions) => {

  // Add handlebars partials loading support.
  api.configureWebpack(webpackConfig => {
    return {
      module: {
        rules: [
          {
            // allows us to require() partials
            test: /(\.hbs|\.handlebars)$/,
            use: {
              loader: 'handlebars-template-loader',
              options: {
                attributes: []
              }
            }
          }
        ]
      }
    }
  })
}
