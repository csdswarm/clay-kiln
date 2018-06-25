'use strict';

const rest = require('../../services/universal/rest'),
  sanitize = require('../../services/universal/sanitize'),
  isEmpty = require('../../services/universal/utils').isFieldEmpty,
  EMBEDLY_ENDPOINT = process.env.EMBEDLY_ENDPOINT,
  EMBEDLY_KEY = process.env.EMBEDLY_KEY;

/**
 * calculate padding for embedded iframes
 * @param {object} embedlyData
 * @returns {string}
 */
function calculatePadding(embedlyData) {
  var width = embedlyData.width,
    height = embedlyData.height;

  if (width && height) {
    // figure out percentage ratio for responsive padding. this is height / width * 100
    return (height / width * 100).toFixed(1) + '%';
  } else {
    return '';
  }
}

function parseEmbedlyData(embedlyData, url) {
  // embed.ly can only handle a certain subset of urls
  // if it can't embed something, `html` will be empty
  if (embedlyData.html) {
    // Strip width and height off of the iframe
    return {
      html: embedlyData.html,
      padding: calculatePadding(embedlyData),
      url,
      lastGenerated: url,
      embedValid: true
    };
  } else {
    // embedly does not support it
    return {
      url,
      lastGenerated: url
    };
  }
}

module.exports.save = (ref, data) => {
  // remove any HTML tags that may have been carried over when pasting from google docs
  data.url = sanitize.toPlainText(data.url);

  // clear fields if sanitized url is empty
  if (isEmpty(data.url)) {
    data.html = '';
    data.padding = '';
    data.lastGenerated = '';
    data.embedValid = true;
    return data;
  // do not generate new html if sanitized url matches url of last html generation
  } else if (data.url === data.lastGenerated) {
    return data;
  }
  // generate new html
  return rest.get(`${EMBEDLY_ENDPOINT}?key=${EMBEDLY_KEY}&url=${encodeURIComponent(data.url)}`)
    .then(embedlyData => parseEmbedlyData(embedlyData, data.url))
    .catch(() => {
      data.embedValid = false;

      return data;
    });
};
