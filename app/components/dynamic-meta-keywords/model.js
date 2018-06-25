'use strict';

const { hypensToSpaces } = require('../../services/universal/dynamic-route-param');

module.exports.render = (ref, data, locals) => {
  const param = locals && locals.params ? hypensToSpaces(locals.params[data.routeParam]) : '',
    variations = data.keywordVariations.map(variation => `${param} ${variation.text}`),
    additionalKeywords = data.additionalKeywords.map(keyword => keyword.text);

  data.keywords = variations.concat(param, additionalKeywords).join(', ');

  return data;
};
