'use strict';

const _ = require('lodash'),
  glob = require('glob'),
  path = require('path'),
  getDependencies = require('claycli/lib/cmd/compile/get-script-dependencies').getDependencies;

const memoizedGetTemplates = _.memoize(getTemplates),
  memoizedClientJS = _.memoize(getClientJS)(),
  componentTemplates = memoizedGetTemplates();

function getClientJS() {
  return glob.sync(path.join('public', 'js', '*.client.js'))
    .map(filepath => filepath.replace('public/',''));
}

function getTemplates() {
  return glob.sync(path.join('public', 'js', 'templates-*.js'))
    .filter(filename => !_.includes(filename, 'clay-kiln.template.js')) // don't add kiln's template
    .map(filepath => filepath.replace('public/',''));
}

/**
 * Update the `media` object based on parameters included
 * in the request for a page/component
 *
 * @param  {Object} media
 * @param  {Object} locals
 */
// Allow a higher complexity than normal
/* eslint complexity: ["error", 9] */
function resolveMedia(media, locals) {
  const assetPath = locals.site.assetHost || locals.site.assetPath;

  // We're dealing with a page, let's include the site CSS,
  // and the view-before/view-after/edit-before scripts as needed
  if (locals.edit) {
    // edit mode - whole page
    media.scripts = _.flatten([
      getDependencies(media.scripts, assetPath, { edit: true, minify: true }),
      componentTemplates.map(templatePath => `${assetPath}/${templatePath}`)
    ]);
    media.styles.unshift(assetPath + '/css/_kiln-plugins.css');
  } else {
    // view mode - whole page
    media.scripts = _.flatten([
      getDependencies(memoizedClientJS, assetPath) // Send through ALL client.js files
    ]);
  }

  // Load all styles on initial page load so SPA doesn't break on navigation
  media.styles = glob.sync(path.join('public', 'css', `*.${locals.site.slug}.css`))
    .map(filepath => filepath.replace('public',''));

  // Check if we are loading a component directly
  if (locals.url.indexOf('/_components/') !== -1 && locals.query['ignore_resolve_media'] === 'true') {
    media.styles = media.scripts = [];
  }
};

module.exports = resolveMedia;
