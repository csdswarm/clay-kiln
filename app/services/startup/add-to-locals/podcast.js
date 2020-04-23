'use strict';
const { PODCASTS } = require('../../universal/constants'),
  radioApiService = require('../../server/radioApi'),
  { wrapInTryCatch } = require('../middleware-utils');

/**
 * fetch podcast show data
 * @param {object} locals
 * @param {string} dynamicSlug
 * @returns {Promise<object>}
 */
const getPodcastShow = (locals, dynamicSlug) => {
  const route = `podcasts?filter[site_slug]=${ dynamicSlug }`;

  return radioApiService.get(route, {}, null, {}, locals).then(response => {
    return response.data[0] || {};
  });
};

/**
 * adds 'podcast' onto locals.
 *
 * @param {object} app - the express app
 */
module.exports = async app => {
  app.use(wrapInTryCatch(async (req, res, next) => {
    const params = req.originalUrl.split('/'),
      [,, isPodcast, slug] = params;

    if (isPodcast === PODCASTS) {
      const locals = res.locals,
        dynamicSlug = slug.split('?');
      
      res.locals.podcast = await getPodcastShow(locals, dynamicSlug[0]);
    }
    next();
  }));
};
