'use strict';

const _pick = require('lodash/pick'),
  sanitize = require('../../services/universal/sanitize'),
  { handleDefault } = require('../../services/kiln/plugins/default-text-with-override/on-model-save');

module.exports.save = (uri, data, locals) => {
  // If data.title is an empty string or undefined, and locals.newPageStation exists
  // we are creating a new station page and should set the values for the intial meta data
  const populateTitle = (
    data.defaultTitle === ''
    || data.defaultTitle === undefined
  ) && locals.newPageStation;

  if (populateTitle) {
    data.defaultTitle     = `${locals.newPageStation.name} ${locals.newPageStation.slogan}`;
    data.defaultKilnTitle = data.defaultTitle;
  };

  const defaultProps = _pick(data, [
    'defaultTitle',
    'defaultOgTitle',
    'defaultTwitterTitle',
    'defaultKilnTitle'
  ]);

  Object.assign(data, sanitize.recursivelyStripSeperators(defaultProps));

  handleDefault('title', 'defaultTitle', data);
  handleDefault('ogTitle', 'defaultOgTitle', data);
  handleDefault('twitterTitle', 'defaultTwitterTitle', data);
  handleDefault('kilnTitle', 'defaultKilnTitle', data);

  return data;
};
