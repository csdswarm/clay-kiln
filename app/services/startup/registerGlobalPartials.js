'use strict';
const glob = require('glob'),
  path = require('path');

module.exports = function (env) {
  const partials = glob.sync(path.resolve(__dirname, '../../global/_partials', '**', '*.hbs'));

  console.log('[partials]', partials);
  if (!env) {
    const
      handlebars = require('handlebars'),
      clayHbs = require('clayhandlebars');

    env = clayHbs(handlebars);
  }

  // add partials
  partials.forEach(p => env.registerPartial(path.basename(p, '.hbs'), require(p)));

  return env;
};
