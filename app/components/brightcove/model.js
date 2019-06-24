'use strict';

const brightcoveApi = require('../../services/universal/brightcoveApi'),
  moment = require('moment');

module.exports.render = async (ref, data, locals) => {
  const { videoId } = data,
    videoData = await brightcoveApi.getVideoDetails(videoId),
    analyticsData = await brightcoveApi.getVideoAnalytics(videoId);

  if (videoData) {
    data.name = videoData.name;
    data.description = videoData.description;
    data.longDescription = videoData.long_description;
    data.thumbnailUrl = videoData.images && videoData.images.thumbnail && videoData.images.thumbnail.src;
    data.createdAt = videoData.created_at;
    data.publishedAt = videoData.published_at;
    data.updatedAt = videoData.updated_at;
    // for some reason this was getting parsed back to millisecond integer value when not wrapped in a string
    data.duration = `${moment.duration(videoData.duration)}`;
    data.link = videoData.link;
  }

  // for some reason, api returns null for link... if this happens, give the article url
  data.seoContentUrl = data.contentUrl || locals.url;
  data.seoHeadline = data.description || data.name;
  data.seoDescription = data.longDescription || data.description || data.name;
  data.seoEmbedUrl = `https://players.brightcove.net/${locals.site.brightcoveAccountId}/${locals.site.brightcovePlayerId}_default/index.html?videoId=${videoId}`;

  if (analyticsData && analyticsData.items && analyticsData.items.length == 1) {
    data.views = analyticsData.items[0].video_view;
  }

  return data;
};
