'use strict';
const radioApiService = require('../../../services/server/radioApi'),
  _isEmpty = require('lodash/isEmpty'),
  { wrapInTryCatch } = require('../../../services/startup/middleware-utils');

/**
* fetch podcast show data
* @param {object} locals
* @param {string} dynamicSlug
* @returns {Promise<object>}
*/
const getPodcastShow = async (locals, dynamicSlug) => {
    const route = `podcasts?filter[site_slug]=${ dynamicSlug }`,
      { data } = await radioApiService.get(route, {}, null, {}, locals);
    
    if (_isEmpty(data)) {
      return {};
    }
    
    return data[0];
  },
  /**
  * fetch podcast show data
  * @param {object} req
  * @param {object} res
  * @param {object} next
  * @returns {Promise<object>}
  */
  podcastMiddleware = wrapInTryCatch(async ( req, res, next ) => {
    const { dynamicSlug } = req.params,
      locals = res.locals;

    res.locals.podcast = await getPodcastShow(locals, dynamicSlug);

    next();
  });

/**
 * adds 'podcast' onto locals.
 *
 * @param {object} app - the express app
 */
module.exports = {
  podcastMiddleware,
  getPodcastShow
};
