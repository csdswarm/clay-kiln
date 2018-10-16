// For some reason the SPA build process fails if an eslint file isn't defined here.
// Probably because we include code from outside /spa, that is the clay handlebars helpers and partials that end in .js
// So we need to update the spa webpack to not run eslint on .js files outside of /spa
module.exports = {}