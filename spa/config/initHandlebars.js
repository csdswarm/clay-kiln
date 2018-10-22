/**
 *
 * This initializes handlebars with the helpers, partials, and SVG assets required to use clay templates.
 *
 */

// Import dependencies.
import vanillaHandlebars from 'handlebars'
import clayHBS from 'clayhandlebars'
import clayKilnPartial from '../../app/node_modules/clay-kiln/template.handlebars'
import clayHelpers from '../../app/services/universal/helpers'

// Attach handlebars helper dependencies from 'clayhandlebars'.
const handlebars = clayHBS(vanillaHandlebars)

// Attach Clay handlebars helpers dependencies.
Object.keys(clayHelpers).forEach(helperName => {
  const helperFn = clayHelpers[helperName]
  handlebars.registerHelper(helperName, helperFn)
})

// Attach Clay handlebars partials dependencies.
handlebars.registerPartial('clay-kiln', clayKilnPartial)

// Note: require.context is proprietary to webpack.
const morePartialsReq = require.context('../../app/components', true, /^.*(\.hbs|\.handlebars)$/)
morePartialsReq.keys().forEach(p => {
  const partialNameMatchResult = p.match(/^\.\/([a-z-]+)\/template\.(?:hbs|handlebars)$/)
  handlebars.registerPartial(partialNameMatchResult[1], morePartialsReq(p))
})

// Attach SVG asset dependencies.
handlebars.svgAssets = {}
const svgAssetsReq = require.context('../../app/components', true, /.svg$/)
svgAssetsReq.keys().forEach(p => {
  const mappedPath = p.replace('./', 'components/') // Translate webpack require path to path actually expected by "read" helper used in clay templates.
  handlebars.svgAssets[mappedPath] = svgAssetsReq(p)
})

// Define clay handlebars "read" helper to reference attached SVGs.
handlebars.registerHelper('read', function (svgPath) {
  return this.svgAssets[svgPath]
}.bind(handlebars))

export { handlebars }
