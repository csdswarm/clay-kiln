'use strict';

const fs = require('fs'),
  _each = require('lodash/each'),
  _forIn = require('lodash/forIn'),
  handlebars = require('handlebars'),
  nymagHbs = require('clayhandlebars'),
  hbs = nymagHbs(handlebars.create()),
  glob = require('glob'),
  path = require('path'),
  helpers = require('../universal/helpers');

/**
 * init hbs partials for feed components
 */
function init() {
  _forIn(helpers, function (value, key) {
    // set up handlebars helpers that rely on internal services
    hbs.registerHelper(`${key}`, value);
  });

  // searches the components directories for any feed.hbs files -- was having weird behavior when using relative path.. was starting in /app
  let templates = glob.sync(path.join(__dirname, '..', '..', 'components', '**', 'feed.hbs'));

  // compile the feed.hbs files
  _each(templates, (template) => {
    let match = template.match(/components\/([^\/]+)\//);

    if (match) {
      hbs.partials[`${match[1]}`] = hbs.compile(`${fs.readFileSync(template)}`, { preventIndent: true });
    }
  });
};

/**
 * render a feed component from the name and data
 *
 * @param {String} cmptName
 * @param {Object} cmptData
 * @returns {String}
 */
function renderComponent(cmptName, cmptData) {
  return hbs.partials[`${cmptName}`] ? hbs.partials[`${cmptName}`](cmptData) : '';
}

module.exports.init = init;
module.exports.hbs = hbs;
module.exports.renderComponent = renderComponent;
