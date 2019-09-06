'use strict';

const apiHelper = require('../../services/universal/brightcove-proxy-helper');

module.exports.save = async (ref, data) => {
  if (data.video && data.video.id) {
    return await apiHelper.addVideoDetails(data);
  }
  return data;
};

module.exports.render = async (ref, data, locals) => {
  const { video } = data;

  // for some reason, api returns null for link... if this happens, give the article url
  data.seoContentUrl = data.link || locals.url;
  data.seoHeadline = data.description || data.name;
  data.seoDescription = data.longDescription || data.description || data.name;

  if (video && video.id) {
    data.seoEmbedUrl = `https://players.brightcove.net/${locals.site.brightcoveAccountId}/${locals.site.brightcoveLivePlayerId}_default/index.html?videoId=${video.id}&adConfigId=${data.adConfig}`;
    data.views = await apiHelper.getVideoViews(video.id);
  }

  return data;
};
