'use strict';

/**
 * This file helps with creating the clay url and making the request to hit the proxy
 * for the brightcove api. This is necessary because calls to brightcove cannot happen
 * client-side. This file is located here because when using a helper file inside the
 * component directory, it wasn't storing the CLAY_SITE_PROTOCOL env var in
 * window.process.env on the frontend.
 */

const radioApi = require('../server/radioApi'),
  url = `${process.env.CLAY_SITE_PROTOCOL}://${process.env.CLAY_SITE_HOST}/api/brightcove`,
  ttl = radioApi.TTL.NONE;

/**
 * Use the proxy to hit the brightcove api for video data
 *
 * @param {integer} videoId
 */
async function getVideoDetails(videoId) {
  return await radioApi.get(url, {
    route: `videos/${videoId}`,
    api: 'cms',
    ttl
  }, null, { ttl });
};

/**
 * Use the proxy to hit the brightcove api for video views analytics
 *
 * @param {integer} videoId
 */
async function getVideoViews(videoId) {
  // might look confusing here, but send a param of ttl = 5 min so that the brightcove api response is cached
  // but this initial call to the proxy should not be cached.
  const analyticsData = await radioApi.get(url, {
    api: 'analytics',
    ttl: radioApi.TTL.MIN * 5,
    params: {
      dimensions: 'video',
      where: `video==${videoId}`
    }
  }, null, { ttl });

  if (analyticsData && analyticsData.items && analyticsData.items.length === 1) {
    return analyticsData.items[0].video_view;
  } else {
    return null;
  }
};

module.exports.getVideoDetails = getVideoDetails;
module.exports.getVideoViews = getVideoViews;
