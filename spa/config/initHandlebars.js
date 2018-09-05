/**
 *
 * This initializes handlebars with the helpers and partials required to use clay templates.
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

export { handlebars }
