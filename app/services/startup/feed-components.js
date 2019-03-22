'use strict';

const fs = require('fs'),
  _each = require('lodash/each'),
  handlebars = require('handlebars'),
  nymagHbs = require('clayhandlebars'),
  hbs = nymagHbs(handlebars.create()),
  glob = require('glob'),
  path = require('path');

module.exports.init = function () {
  // searches the components directories for any feed.hbs files -- was having weird behavior when using relative path.. was starting in /app
  let templates = glob.sync(path.join(__dirname, '..', '..', 'components', '**', 'feed.hbs'));

  // compile the feed.hbs files
  _each(templates, (template) => {
    let match = template.match(/components\/([^\/]+)\//);

    if (match) {
      hbs.partials[`feed-${match[1]}`] = hbs.compile(`${fs.readFileSync(template)}`, { preventIndent: true });
    }
  });
};

module.exports.hbs = hbs;
