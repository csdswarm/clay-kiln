'use strict';
const { PODCASTS } = require('../../universal/constants'),
  radioApiService = require('../../server/radioApi');

/**
 * fetch podcast show data
 * @param {object} locals
 * @param {string} dynamicSlug
 * @returns {Promise<object>}
 */
const getPodcastShow = async (locals, dynamicSlug) => {
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
  app.use((req, res, next) => {
    const params = req.originalUrl.split('/'),
      [,, isPodcast, slug] = params;

    if (isPodcast === PODCASTS) {
      const locals = res.locals,
        dynamicSlug = slug.split('?');
      
      getPodcastShow(locals, dynamicSlug[0])
        .then(podcast => res.locals.podcast = podcast)
        .catch(err => console.log('Error: ', err));
    }
    next();
  });
};
