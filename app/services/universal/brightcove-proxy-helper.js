'use strict';

/**
 * This file helps with creating the clay url and making the request to hit the proxy
 * for the brightcove api. This is necessary because calls to brightcove cannot happen
 * client-side. This file is located here because when using a helper file inside the
 * component directory, it wasn't storing the CLAY_SITE_PROTOCOL env var in
 * window.process.env on the frontend.
 */

const radioApi = require('../server/radioApi'),
  moment = require('moment'),
  log = require('./log').setup({ file: __filename }),
  baseUrl = `${ process.env.CLAY_SITE_PROTOCOL }://${ process.env.CLAY_SITE_HOST }`,
  url = `${ baseUrl }/api/brightcove`,
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
}

/**
 * Use the proxy to hit the brightcove api for video views analytics
 *
 * @param {integer} videoId
 */
async function getVideoViews(videoId) {
  if (!videoId) {
    return null;
  }

  // might look confusing here, but send a param of ttl = 5 min so that the brightcove api response is cached
  // but this initial call to the proxy should not be cached.
  const analyticsData = await radioApi.get(url, {
    api: 'analytics',
    route: videoId,
    ttl: radioApi.TTL.MIN * 5
  }, null, { ttl: radioApi.TTL.MIN * 5 });

  if (analyticsData && analyticsData.alltime_video_views) {
    return {
      views: analyticsData.alltime_video_views,
      redisExpiresAt: analyticsData.redis_expires_at
    };
  } else {
    return null;
  }
}

/**
 * Retrieves the video source for a brightcove video
 *
 * @param {String} id
 * @returns {String|null}
 */
async function getVideoSource(id) {
  try {
    const { sourceUrl } = await radioApi.get(`${baseUrl}/brightcove/getVideoSource/${id}`);

    return sourceUrl;
  } catch (error) {
    log('error', 'issue getting video source url', error);
    return null;
  }
}

/**
 * Use the proxy to hit the brightcove api for video data
 *
 * @param {Object} data
 */
async function addVideoDetails(data) {
  if (!data.video || !data.video.id) {
    return null;
  }

  try {
    const { video } = data,
      { id } = video,
      [videoData, videoSource] = await Promise.all([
        getVideoDetails(video.id),
        getVideoSource(id)
      ]);

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
      data.video.m3u8Source = videoSource;
    }
  } catch (error) {
    log('error', 'issue adding video details', error);
  }

  return data;
}

module.exports.getVideoViews = getVideoViews;
module.exports.addVideoDetails = addVideoDetails;
