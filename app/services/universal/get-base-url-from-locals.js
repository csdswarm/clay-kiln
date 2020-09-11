'use strict';

/**
 * Returns url without query params
 *
 * @param {Object} locals
 * @returns {String}
 */
const getBaseUrlFromLocals = (locals) => {
  if (locals && locals.url) {
    const fullUrl = locals.url.replace('http:', 'https:'),
      paramsIndex = fullUrl.indexOf('?'),
      baseUrl = paramsIndex > 0 ? fullUrl.substring(0, paramsIndex) : fullUrl;

    return baseUrl;
  }
};

module.exports = getBaseUrlFromLocals;
