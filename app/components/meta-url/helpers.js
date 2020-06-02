'use strict';
/**
 * ON-367 helper function for fixing http urls -
 * they need to be https
 * @param {object} data
 */
function fixHttpUrl(data) {
  if (data.url) {
    data.url = data.url.replace('http://', 'https://');
  }
}

/**
 * ON-367 - removes syndicatedUrl if it is an empty string OR it contains ".com/api/v1.0" as during
 * the period where we had api sync issues with frequency, several content
 * items were imported with incorrect syndicated urls
 * @param {object} data
 */
function fixSyndicatedUrl(data) {
  if (data.syndicatedUrl) {
    data.syndicatedUrl = data.syndicatedUrl.replace('http://', 'https://');
  }
  if (data.syndicatedUrl &&
    data.syndicatedUrl.indexOf('.com/api/v1.0') !== -1) {
    data.syndicatedUrl = null;
  }
}

/**
 * set component canonical url and date if they're passed in through the locals
 * @param {object} data
 * @param {object} [locals]
 */
function setFromLocals(data, locals) {
  if (locals && locals.publishUrl) {
    data.url = locals.publishUrl;
  }

  if (locals && locals.date) {
    data.date = locals.date;
  }
}

module.exports.fixHttpUrl = fixHttpUrl;
module.exports.fixSyndicatedUrl = fixSyndicatedUrl;
module.exports.setFromLocals = setFromLocals;
