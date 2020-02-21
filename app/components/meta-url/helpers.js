'use strict';
/**
 * ON-367 helper function for fixing http urls -
 * they need to be https
 * @param {object} data
 */
function fixHttpUrl(data) {
  if (data.defaultUrl) {
    data.defaultUrl = data.defaultUrl.replace('http://', 'https://');
  }
}

/**
 * ON-367 - removes syndicatedUrl if it is an empty string OR it contains ".com/api/v1.0" as during
 * the period where we had api sync issues with frequency, several content
 * items were imported with incorrect syndicated urls
 * @param {object} data
 */
function fixSyndicatedUrl(data) {
  if (data.defaultSyndicatedUrl) {
    data.defaultSyndicatedUrl = data.defaultSyndicatedUrl.replace('http://', 'https://');
  }
  if (data.defaultSyndicatedUrl &&
    data.defaultSyndicatedUrl.indexOf('.com/api/v1.0') !== -1) {
    data.defaultSyndicatedUrl = null;
  }
}

/**
 * set component canonical url and date if they're passed in through the locals
 * @param {object} data
 * @param {object} [locals]
 */
function setFromLocals(data, locals) {
  if (locals && locals.publishUrl) {
    data.defaultUrl = locals.publishUrl;
  }

  if (locals && locals.date) {
    data.defaultDate = locals.date;
  }
}

module.exports.fixHttpUrl = fixHttpUrl;
module.exports.fixSyndicatedUrl = fixSyndicatedUrl;
module.exports.setFromLocals = setFromLocals;
