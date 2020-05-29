'use strict';

const redis = require('./redis'),
  log = require('../universal/log').setup({ file: __filename }),
  { addAmphoraRenderTime } = require('../universal/utils'),
  { DEFAULT_RADIOCOM_LOGO } = require('../universal/constants'),
  { uploadImage } = require('./s3');

/**
 * uploads the feed image to s3, and saves the s3 image url to redis
 *
 * @param {string} redisKey
 * @param {string} url
 */
async function uploadImageAndSaveInRedis(redisKey, url) {
  let s3ImgUrl;

  try {
    s3ImgUrl = await uploadImage(url);
  } catch (err) {
    log('error', 'error when uploading the image to s3', err);

    // return early so we don't attempt to save anything to redis
    return;
  }

  try {
    await redis.set(redisKey, s3ImgUrl);
  } catch (err) {
    log('error', 'error when saving to redis', err);
  }
}

/**
 * checks the url in redis to first ensure we haven't already uploaded the url.
 *   If we have it in redis then return that value, otherwise
 *   1. upload the image to S3
 *   2. return the radio.com default image
 *   3. when the upload is finished, store the s3 url in redis for
 *      future requests
 *
 * this process exists because s3 file uploads were taking a long time and
 *   causing model.get timeouts in amphora
 *
 * note: storing in redis is a little weird since we don't want these keys to
 *   ever expire which means a permanent storage solution like postgres would be
 *   more fitting.  However this code change is more or less a hotfix and using
 *   postgres would take longer.  Also using the external station feed is a
 *   temporary solution until all stations are migrated into unity, at which
 *   point all images will be internal - meaning the permanent storage
 *   requirement won't be around for that long.
 *
 * @param {string} url
 * @param {object} [locals]
 * @param {object} [argObj]
 * @param {boolean} [argObj.shouldAddAmphoraTimings]
 * @param {string} [argObj.amphoraTimingLabelPrefix]
 * @returns {string}
 */
module.exports = async (url, locals, argObj = {}) => {
  if (!url) {
    throw new Error('url cannot be falsey');
  }

  const {
      shouldAddAmphoraTimings = false,
      amphoraTimingLabelPrefix
    } = argObj,
    redisKey = `station-feed-img:${url}`,
    beforeRedis = new Date();

  let s3ImgUrl;

  try {
    s3ImgUrl = await redis.get(redisKey);
  } finally {
    addAmphoraRenderTime(
      locals,
      {
        data: { redisKey },
        label: 'get from redis',
        ms: new Date() - beforeRedis
      },
      {
        prefix: amphoraTimingLabelPrefix,
        shouldAdd: shouldAddAmphoraTimings
      }
    );
  }

  if (s3ImgUrl) {
    return s3ImgUrl;
  }

  // we don't want to await this, if it contains errors they will be logged
  uploadImageAndSaveInRedis(redisKey, url);

  return DEFAULT_RADIOCOM_LOGO;
};
