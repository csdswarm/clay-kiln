'use strict';

/**
 * Sets component canonical url if it's passed in through the locals
 * @param {object} data
 * @param {object} [locals]
 */
function setUrl(data, locals) {
  if (locals && locals.publishUrl) {
    data.url = locals.publishUrl;
  }
}

module.exports.save = (ref, data, locals) => {
  setUrl(data, locals); // Save the canonical url on PUT because on GET locals does not have canonicalUrl.

  return data;
};
