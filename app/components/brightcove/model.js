'use strict';

const brightcoveApi = require('../../services/universal/brightcoveApi');

module.exports.render = async (ref, data) => {
  const { videoId } = data,
    // cache this response for 5-10 min
    videoData = await brightcoveApi.getVideoDetails(videoId),
    // cache this response for 5-10 min
    analyticsData = await brightcoveApi.getVideoAnalytics(videoId);

  if (videoData) {
    data.name = videoData.name;
    data.description = videoData.description;
    data.longDescription = videoData.long_description;
    data.thumbnailUrl = videoData.images && videoData.images.thumbnail && videoData.images.thumbnail.src;
    data.createdAt = videoData.created_at;
    data.publishedAt = videoData.published_at;
    data.updatedAt = videoData.updated_at;
    data.duration = videoData.duration;
  }

  if (analyticsData && analyticsData.items && analyticsData.items.length == 1) {
    data.views = analyticsData.items[0].video_view;
  }

  // TODO: still need contentUrl & embedUrl

  return data;
};
