'use strict';

const brightcoveApi = require('../../services/universal/brightcoveApi'),
  log = require('../../services/universal/log').setup({file: __filename});

// just to test
module.exports.render = async (ref, data, locals) => {
  const { videoId } = data,
    // cache this response for 5-10 min
    res = await brightcoveApi.request('GET', `videos/${videoId}`),
    playback = await brightcoveApi.request('GET', `videos/${videoId}`, 'playback'),
    params = { 
      dimensions: 'video',
      where: `video==${videoId}`
    },
    // cache this response for 5-10 min
    analyticsData = await brightcoveApi.request('GET', ``, params, null, 'analytics');

  log('info', `playback: ${JSON.stringify(playback)}`);

  if (res) {
    data.name = res.name;
    data.description = res.description;
    data.longDescription = res.long_description;
    data.thumbnailUrl = res.images && res.images.thumbnail && res.images.thumbnail.src;
    data.createdAt = res.created_at;
    data.publishedAt = res.published_at;
    data.updatedAt = res.updated_at;
    data.duration = res.duration;
  }

  if (analyticsData && analyticsData.items && analyticsData.items.length == 1) {
    data.views = analyticsData.items[0].video_view;
  }

  // TODO: still need contentUrl & embedUrl

  return data;
};