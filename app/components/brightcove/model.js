'use strict';

const _get = require('lodash/get'),
  apiHelper = require('../../services/universal/brightcove-proxy-helper'),
  db = require('../../services/server/db');

module.exports = {
  save: async (ref, data) => {
    if (data.video && data.video.id) {
      return await apiHelper.addVideoDetails(data);
    }
    return data;
  },
  render: async (ref, data, locals) => {
    const { video } = data;

    // If we're server-side and redis cache is outdated, update the views
    if (_get(video, 'id') && _get(process, ['versions', 'node']) && (!data.redisExpiresAt || Date.now() > new Date(data.redisExpiresAt))) {
      const { views, redisExpiresAt } = await apiHelper.getVideoViews(video.id);

      data.views = views;
      data.redisExpiresAt = redisExpiresAt;
      // Update the draft and published data
      db.put(ref, data);
      db.put(`${ref}@published`, data);
    }

    // for some reason, api returns null for link... if this happens, give the article url
    data.seoContentUrl = data.link || locals.url;
    data.seoHeadline = data.description || data.name;
    data.seoDescription = data.longDescription || data.description || data.name;

    if (_get(video, 'id')) {
      data.seoEmbedUrl = `https://players.brightcove.net/${locals.site.brightcoveAccountId}/${locals.site.brightcovePlayerId}_default/index.html?videoId=${video.id}`;
    }

    return data;
  }
};
