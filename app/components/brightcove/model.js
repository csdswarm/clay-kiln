'use strict';

const brightcoveApi = require('../../services/universal/brightcoveApi'),
  log = require('../../services/universal/log').setup({file: __filename});

module.exports.save = (ref, data, locals) => {
  let { videoId, playerId, accountId } = data;

  // https://docs.brightcove.com/cms-api/v1/doc/index.html#operation/GetVideos
  // need to get: /accounts/{account_id}/videos/{videoId}
  // name: data.name
  // description: data.description | data.long_description
  // thumbnailUrl: data.images.thumbnail.src
  // uploadDate: data.created_at | data.published_at | data.updated_at
  // contentUrl: ''
  // duration: data.duration
  // embedUrl: ''
  // interactionCount: 0

  return data;
};

// just to test
module.exports.render = async (ref, data, locals) => {
  const { videoId, playerId, accountId } = data;

  // do a call for interactionCount
  let res = await brightcoveApi.request('GET', `videos/${videoId}`);
  log('info', `brightcoveApiResponse: ${JSON.stringify(res)}`);


  // https://docs.brightcove.com/cms-api/v1/doc/index.html#operation/GetVideos
  // need to get: /accounts/{account_id}/videos/{videoId}
  // name: data.name
  // description: data.description | data.long_description
  // thumbnailUrl: data.images.thumbnail.src
  // uploadDate: data.created_at | data.published_at | data.updated_at
  // contentUrl: ''
  // duration: 0
  // embedUrl: ''
  // interactionCount: 0

  return data;
};