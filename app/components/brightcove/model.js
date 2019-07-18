'use strict';

const apiHelper = require('./api-helper');

module.exports.save = async (ref, data) => {
  if (data.videoId) {
    return await apiHelper.addVideoDetails(data);
  }
  return data;
};

module.exports.render = async (ref, data, locals) => {
  const { videoId } = data;

  // for some reason, api returns null for link... if this happens, give the article url
  data.seoContentUrl = data.link || locals.url;
  data.seoHeadline = data.description || data.name;
  data.seoDescription = data.longDescription || data.description || data.name;

  if (data.videoId) {
    data.seoEmbedUrl = `https://players.brightcove.net/${locals.site.brightcoveAccountId}/${locals.site.brightcovePlayerId}_default/index.html?videoId=${videoId}`;
    data.views = await apiHelper.getVideoViews(videoId);
  }

  return data;
};
