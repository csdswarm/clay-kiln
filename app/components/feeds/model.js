'use strict';

const queryService = require('../../services/server/query'),
  bluebird = require('bluebird'),
  log = require('../../services/universal/log').setup({
    file: __filename,
    component: 'feeds'
  });

/**
 * Make sure you have an index, transform and meta property on the
 * data
 * @param  {String} uri
 * @param  {Object} data
 * @return {Promise|Object}
 */
module.exports.save = function (uri, data) {
  const { meta } = data;

  if (!data.index || !meta) {
    return bluebird.reject(new Error('Feeds component requires an `index` and `meta` property'));
  }

  if (!meta.renderer) {
    return bluebird.reject(new Error('A feed needs to specify which renderer to use'));
  }

  if (!meta.contentType) {
    return bluebird.reject(new Error('A feed needs to indicate the `Content-Type` a component\'s final data will be served in'));
  }

  if (!meta.fileExtension) {
    return bluebird.reject(new Error('A feed needs a `fileExtension` property to indicate the file type of the scraped feed'));
  }

  return data;
};


/**
 * This render function's pure function is to execute
 * an Elastic query stored in the data.
 *
 * @param  {String} ref
 * @param  {Object} data
 * @param  {Object} locals
 * @return {Promise|Object}
 */
module.exports.render = function (ref, data, locals) {
  let ES_QUERY,
    { meta } = data;

  if (!data.index) {
    log('error', 'Feed cmpt requires an `index` and `transform` property in the data');
    return data;
  }

  // If the query param `skipQuery` is present, don't query.
  // Handy for only fetching metadata
  if (locals && locals.skipQuery) {
    return data;
  }

  ES_QUERY = queryService(data.index, locals); // Build the appropriate query obj for the env
  ES_QUERY.body.query = data.query.query; // Just replace all the properties in query with the data
  ES_QUERY.body.size = data.query.size;
  ES_QUERY.body.sort = data.query.sort;
  ES_QUERY.body._source = data.query._source;

  if (meta.rawQuery) {
    return queryService.searchByQueryWithRawResult(ES_QUERY)
      .then((results) => {
        data.results = results.hits.hits; // Attach results and return data
        return data;
      });
  } else {
    return queryService.searchByQuery(ES_QUERY)
      .then((results) => {
        data.results = results; // Attach results and return data
        return data;
      });
  }
};
