'use strict';

const _get = require('lodash/get'),
  { SERVER_SIDE } = require('../../services/universal/constants'),
  apiHelper = require('../../services/universal/brightcove-proxy-helper'),
  db = require('../../services/server/db'),                                         // Only used server-side
  log = require('../../services/universal/log').setup({ file: __filename }),  // Only used server-side
  radioApi = require('../../services/server/radioApi') ;                            // Only used server-side

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
    if (_get(video, 'id') && SERVER_SIDE && (!data.cacheExpiresAt || Date.now() > new Date(data.cacheExpiresAt))) {
      data.views = await apiHelper.getVideoViews(video.id);
      data.cacheExpiresAt = new Date(Date.now() + (radioApi.TTL.MIN * 5));
      // Update this component instance
      db.put(ref, data)
        .catch(e => {
          log('warn', 'Could not update Brightcove component video views', e);
        });
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
