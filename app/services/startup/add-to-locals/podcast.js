'use strict';
const { PODCASTS } = require('../../universal/constants'),
  radioApiService = require('../../server/radioApi'),
  { wrapInTryCatch } = require('../middleware-utils'),
  _last = require('lodash/last'),
  _isEmpty = require('lodash/isEmpty');

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
};

/**
 * adds 'podcast' onto locals.
 *
 * @param {object} app - the express app
 */
module.exports = async app => {
  app.use(wrapInTryCatch(async (req, res, next) => {
    if (req.originalUrl.includes(PODCASTS)) {
      const params = req.originalUrl.split('/'),
        slug = _last(params);

      if (slug !== PODCASTS) {
        const locals = res.locals,
          dynamicSlug = slug.split('?');
        
        res.locals.podcast = await getPodcastShow(locals, dynamicSlug[0]);
      }
    }
    next();
  }));
};
