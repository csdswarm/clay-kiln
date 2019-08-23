'use strict';

const proxyHelper = require('../../services/universal/brightcove-proxy-helper'),
  moment = require('moment');

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
    videoData = await proxyHelper.getVideoDetails(video.id);

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
  if (!videoId) {
    return null;
  }

  return await proxyHelper.getVideoViews(videoId);
};

module.exports.addVideoDetails = addVideoDetails;
module.exports.getVideoViews = getVideoViews;
