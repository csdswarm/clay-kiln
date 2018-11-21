'use strict';

const _ = require('lodash'),
  glob = require('glob'),
  path = require('path'),
  megabundle = require('./megabundle');

let memoizedGetTemplates = _.memoize(getTemplates),
  componentTemplates = memoizedGetTemplates();

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
      megabundle.getDeps(true, media.scripts, assetPath),
      componentTemplates.map(templatePath => `${assetPath}/${templatePath}`),
      `${assetPath}/js/edit-after.js`
    ]);
  } else {
    // view mode - whole page
    media.scripts = _.flatten([
      `${assetPath}/js/view-before.js`,
      megabundle.getDeps(false, media.scripts, assetPath),
      `${assetPath}/js/view-after.js`
    ]);
  }

  // Load all styles on initial page load so SPA doesn't break on navigation
  media.styles = glob.sync(path.join('public', 'css', `*.${locals.site.slug}.css`))
    .map(filepath => filepath.replace('public',''));

  // Check if we are loading a component directly
  if (locals.url.indexOf('/_components/') !== -1) {
    media.styles = media.scripts = [];
  }
};

module.exports = resolveMedia;
