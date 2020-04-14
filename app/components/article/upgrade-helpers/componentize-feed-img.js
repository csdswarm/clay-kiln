'use strict';

const db = require('amphora-storage-postgres'),
  cuid = require('cuid'),
  imageUtils = require('../../../services/universal/image-utils'),
  { CLAY_SITE_HOST: host } = process.env;

/**
 * changes feedImgUrl from just a url to a feed-image component.
 *
 * I couldn't reuse the image component because, among other reasons,
 *   conditionally publishing the url would be a hassle and I've spent too much
 *   time refactoring already.
 *
 * the url alone wasn't sufficient to provide the image metadata necessary for
 *   notifying editors about msn feed restrictions.  This new component
 *   encapsulates that logic (which now exists in the image component as well).
 *
 * @param {string} uri
 * @param {object} data
 * @param {object} locals
 */
module.exports = async (uri, data) => {
  // the default article is handled in article/bootstrap.yml
  if (!uri.includes('/instances/')) {
    return;
  }

  // hardcode the 'new' instance
  if (uri.endsWith('/instances/new')) {
    data.feedImg = {
      _ref: `${host}/_components/feed-image/instances/new`
    };
    return;
  }

  // in all other cases we need to create a new feed-image

  const newFeedImage = await db.get(`${host}/_components/feed-image/instances/new`),
    newFeedImgRef = `${host}/_components/feed-image/instances/${cuid()}`,
    newFeedImgData = Object.assign(newFeedImage, {
      url: data.feedImgUrl
    });

  // this mutates newFeedImgData
  await imageUtils.assignDimensionsAndFileSize(newFeedImgRef, newFeedImgData);

  await db.put(newFeedImgRef, newFeedImgData);

  data.feedImg = { _ref: newFeedImgRef };
};
