/**
 *
 * Handlebars helper that compiles a
 * string to a template with a given context
 *
 */

'use strict';

const
  handlebars = require('handlebars'),
  clayHbs = require('clayhandlebars'),
  hbs = clayHbs(handlebars.create());

module.exports = function renderTemplateString(templateStr, context) {
  if (!templateStr || !context) {
    return '';
  }
  const template = hbs.compile(templateStr);

  return template(context);
};
