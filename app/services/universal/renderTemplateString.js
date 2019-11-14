/**
 *
 * Handlebars helper that compiles a
 * string to a template with a given context
 *
 */

'use strict';

const Handlebars = require('handlebars');

module.exports = function renderTemplateString(templateStr, context) {
  if (!templateStr || !context) {
    return '';
  }
  const template = Handlebars.compile(templateStr);

  return template(context);
};
