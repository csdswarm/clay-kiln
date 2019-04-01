'use strict';

const radioApiService = require('../../services/server/radioApi'),
  defaultStation = {
    id: 0,
    attributes: {
      id: 0,
      name: 'Radio.com',
      callsign: 'NATL-RC',
      website: 'https://www.radio.com',
      slug: 'www',
      square_logo_small: 'http://images.radio.com/aiu-media/og_775x515_0.jpg',
      square_logo_large: 'http://images.radio.com/aiu-media/og_775x515_0.jpg',
      city: 'New York',
      state: 'NY',
      country: 'US',
      gmt_offset: -5,
      market: {
        id: 15,
        name: 'New York, NY'
      }
    }
  },
  /**
   * returns the slug of the site
   *
   * @param {string} host
   * @return {string}
   */
  getStationSlug = (host) => host.split('/').shift().toLowerCase(),
  /**
   * determines if the default station should be used
   *
   * @param {string} slug
   * @return {boolean}
   */
  useDefaultStation = (slug) => ['www', 'clay', 'dev-clay', 'stg-clay'].includes(slug),
  /**
   * determines if the path is valid for station information
   *
   * @param {object} req
   * @return {boolean}
   */
  validPath = (req) => /^\/_/.test(req.originalUrl)
    || req.get('x-amphora-page-json')
    || !req.get('referrer') || !req.get('referrer').includes(req.get('host'));


/**
 * obtain the current station details and store them for all components to access in locals
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = async (req, res, next) => {
  if (validPath(req)) {
    // NOTE: this is currently setup for subdomain, but will eventually become path based in the future.
    const site_slug = getStationSlug(req.get('host'));

    res.locals.station = defaultStation.attributes;

    if (!useDefaultStation(site_slug)) {
      try {
        const response = await radioApiService.get('stations', { filter: { site_slug } });

        if (response.data && response.data.length) {
          res.locals.currentstation = response.data[0].attributes;
        }
      } catch (e) {
      }
    }
  }

  return next();
};

