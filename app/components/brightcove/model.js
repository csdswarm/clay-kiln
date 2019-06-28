'use strict';

const apiHelper = require('./api-helper'),
  // dumb, but this has to be here for kiln to know to put it in window.process.env
  // being used in apiHelper, was coming up `undefined` before this
  // eslint-disable-next-line no-unused-vars
  protocol = process.env.CLAY_SITE_PROTOCOL;

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
