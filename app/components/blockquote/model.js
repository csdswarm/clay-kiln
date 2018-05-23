'use strict';

const { validateTagContent, toSmartText } = require('../../services/universal/sanitize'),
  _flowRight = require('lodash/flowRight');

module.exports.save = (ref, data) => {
  const text = data.text || '';

  data.text = _flowRight(validateTagContent, toSmartText)(text);

  return data;
};
