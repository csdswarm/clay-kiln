'use strict';

/**
 * This file helps with creating the clay url and making the request to hit the proxy
 * for the brightcove api. This is necessary because calls to brightcove cannot happen
 * client-side. This file is located here because when using a helper file inside the
 * component directory, it wasn't storing the CLAY_SITE_PROTOCOL env var in
 * window.process.env on the frontend.
 */

const radioApi = require('../server/radioApi'),
  _get = require('lodash/get'),
  brightcoveApi = require('../universal/brightcoveApi'),
  moment = require('moment'),
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
}

/**
 * Retrieves the video source for a brightcove video
 *
 * @param {String} id
 * @returns {String}
 */
async function getVideoSource(id) {
  const { status, body: videoSources } = await brightcoveApi.request('GET', `videos/${ id }/sources`),
    isSuccess = status === 200;

  if (isSuccess) {
    return _get(videoSources.find(source => {
      return source.type === 'application/x-mpegURL';
    }), 'src', '');
  }

  return '';
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

  const { video } = data,
    { id } = video,
    videoData = await getVideoDetails(video.id);

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

    data.video.m3u8Source = data.video.m3u8Source || await getVideoSource(id);
  }

  return data;
}

module.exports.getVideoViews = getVideoViews;
module.exports.addVideoDetails = addVideoDetails;
