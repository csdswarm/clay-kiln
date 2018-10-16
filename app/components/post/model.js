'use strict';

const formatDate = require('date-fns/format'),
  _find = require('lodash/find'),
  { getComponentName } = require('clayutils'),
  { isPublishedVersion } = require('../../services/universal/utils'),
  db = require('../../services/server/db'),
  promises = require('../../services/universal/promises');

/**
 * Finds the first `image` component in the post's `content` array.
 * If there is one, grab that component's data. If there isn't one,
 * return `null`.
 *
 * @param  {Array} content
 * @param  {Object} locals
 * @return {Promise}
 */
function generateFeedImage({ content }, locals) {
  const firstImage = _find(content, (item) => getComponentName(item._ref) === 'image');
  let reference;

  if (firstImage) {
    reference = firstImage._ref.replace('@published', '');
    return promises.timeout(db.get(reference, locals), 1000).catch(() => null); // fail gracefully
  }
}

/**
 * Sets props for published instances.
 * @param {string} uri
 * @param {object} data
 * @param {object} locals
 */
function setPublishedInstanceProps(uri, data, locals) {
  if (isPublishedVersion(uri) && locals) {
    if (locals.date) {
      data.date = formatDate(locals.date);
    }

    if (locals.publishUrl) {
      data.canonicalUrl = locals.publishUrl;
    }
  }
}

module.exports.save = (uri, data, locals) => {
  setPublishedInstanceProps(uri, data, locals);

  // If the primaryHeadline and displayHeadline are different,
  // save the primaryHeadline again.
  if (!data.primaryHeadline && data.displayHeadline) {
    data.primaryHeadline = data.displayHeadline;
  }

  return promises.props({
    firstImage: generateFeedImage(data, locals)
  }).then(({ firstImage }) => {
    // Set firstImage always
    data.firstImage = firstImage && firstImage.url;

    // Only update feedImage if it is not set
    if (!data.feedImage) {
      data.feedImage = data.firstImage;
    }

    return data;
  });
};
