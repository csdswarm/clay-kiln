'use strict';

const radioApiService = require('../../services/server/radioApi'),
  { isEmpty } = require('lodash'),
  { parse } = require('url'),
  allStations = {},
  defaultStation = {
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
  },
  /**
   * returns the slug of the site either from a subdomain or as the first element of the path
   *
   * @param {object} req
   * @return {string}
   */
  getStationSlug = (req) => {
    const [, stationPath] = req.originalUrl.split('/'),
      stationHost = req.get('host').split('/').shift().split('.').shift().toLowerCase();

    return ['www', 'clay', 'dev-clay', 'stg-clay'].includes(stationHost) ? stationPath : stationHost;
  },
  /**
   * determines if the url passed in belongs to a component (has a slash then underscore)
   *
   * @param {string} uri
   * @return {boolean}
   */
  isComponent = (uri) => uri && /^\/_/.test(parse(uri).pathname),
  /**
   * determines if the path is valid for station information
   *
   * @param {object} req
   * @return {boolean}
   */
  validPath = (req) => req.get('x-amphora-page-json')
    || isComponent(req.originalUrl)
    || isComponent(req.get('referrer'))
    || !req.get('referrer')
    || !req.get('referrer').includes(req.get('host').split('.').slice(1,3).join('.')),
  /**
   * determines if the default station should be used
   *
   * @param {object} req
   * @return {boolean}
   */
  getStation = async (req) => {
    if (validPath(req)) {
      const slug = getStationSlug(req),
        response = await radioApiService.get('stations', {page: {size: 999}}, null, radioApiService.TTL.DAY);

      // use the stations as a cached object so we don't have to run the same logic every request
      if (!response.response_cached || isEmpty(allStations)) {
        response.data.forEach((station) => allStations[station.attributes.site_slug] = station.attributes);
      }

      if (Object.keys(allStations).includes(slug)) {
        return allStations[slug];
      }

      return defaultStation;
    }
  };


/**
 * obtain the current station details and store them for all components to access in locals
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
module.exports = async (req, res, next) => {
  res.locals.station = await getStation(req);

  return next();
};

