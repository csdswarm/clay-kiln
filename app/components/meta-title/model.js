'use strict';

const _pick = require('lodash/pick'),
  sanitize = require('../../services/universal/sanitize'),
  { handleDefault } = require('../../services/kiln/plugins/default-text-with-override/on-model-save');

module.exports.save = (ref, data) => {
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
