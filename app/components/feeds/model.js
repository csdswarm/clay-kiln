'use strict';

const _get = require('lodash/get'),
  getRenderQuery = require('./get-render-query'),
  queryService = require('../../services/server/query'),
  log = require('../../services/universal/log').setup({
    file: __filename,
    component: 'feeds'
  }),
  { CLAY_SITE_PROTOCOL: protocol, CLAY_SITE_HOST: host } = process.env;

function validateSaveInput(data) {
  const { meta } = data;
  let errMsg;

  if (!data.index || !meta) {
    errMsg = 'Feeds component requires an `index` and `meta` property';
  } else if (!meta.renderer) {
    errMsg = 'A feed needs to specify which renderer to use';
  } else if (!meta.contentType) {
    errMsg = 'A feed needs to indicate the `Content-Type` a component\'s final data will be served in';
  } else if (!meta.fileExtension) {
    errMsg = 'A feed needs a `fileExtension` property to indicate the file type of the scraped feed';
  }

  if (errMsg) {
    throw new Error(errMsg);
  }
}

async function assignResults(data, query, locals) {
  const { meta } = data;

  if (meta.rawQuery) {
    const results = await queryService.searchByQueryWithRawResult(query, locals, { shouldDedupeContent: false });

    data.results = results.hits.hits; // Attach results and return data
  } else {
    // Attach results and return data
    data.results = await queryService.searchByQuery(
      query,
      locals,
      {
        includeIdInResult: true,
        shouldDedupeContent: false
      }
    );
  }
}

/**
 * Make sure you have an index, transform and meta property on the
 * data
 * @param  {String} uri
 * @param  {Object} data
 * @return {Promise|Object}
 */
module.exports.save = async (uri, data) => {
  validateSaveInput(data);

  data.meta.link = `${protocol}://${host}`;

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
module.exports.render = async (ref, data, locals) => {
  if (!data.index) {
    log('warn', 'Feed component requires an `index` and `transform` property in the data');
    return data;
  }

  // Handy for only fetching metadata
  if (_get(locals, 'skipQuery')) {
    return data;
  }

  const query = getRenderQuery(data, locals);

  try {
    await assignResults(data, query, locals);
  } catch (e) {
    queryService.logCatch(e, 'feeds.model');
  }

  return data;
};
