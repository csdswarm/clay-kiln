'use strict';

const radioApi = require('../../services/server/radioApi'),
  moment = require('moment'),
  url = `${process.env.CLAY_SITE_PROTOCOL}://${process.env.CLAY_SITE_HOST}/api/brightcove`,
  ttl = radioApi.TTL.NONE;

/**
 * Use the proxy to hit the brightcove api for video data
 *
 * @param {Object} data
 */
async function addVideoDetails(data) {
  const { videoId } = data,
    videoData = await radioApi.get(url, {
      route: `videos/${videoId}`,
      api: 'cms',
      ttl
    }, null, { ttl });

  if (videoData) {
    data.name = videoData.name;
    data.description = videoData.description;
    data.longDescription = videoData.long_description;
    data.thumbnailUrl = videoData.images && videoData.images.thumbnail && videoData.images.thumbnail.src;
    data.bcCreatedAt = videoData.created_at;
    data.bcPublishedAt = videoData.published_at;
    data.bcUpdatedAt = videoData.updated_at;
    // for some reason this was getting parsed back to millisecond integer value when not wrapped in a string
    data.duration = `${moment.duration(videoData.duration)}`;
    data.link = videoData.link;
  }

  return data;
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

  if (analyticsData && analyticsData.items && analyticsData.items.length == 1) {
    return analyticsData.items[0].video_view;
  } else {
    return null;
  }
};

module.exports.addVideoDetails = addVideoDetails;
module.exports.getVideoViews = getVideoViews;
