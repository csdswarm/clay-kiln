'use strict';

const radioApiService = require('../../services/server/radioApi'),
  { isEmpty } = require('lodash'),
  { extname } = require('path'),
  allStations = {},
  defaultStation = {
    id: 0,
    name: 'Radio.com',
    callsign: 'NATL-RC',
    website: 'https://www.radio.com',
    slug: 'www',
    square_logo_small: 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
    square_logo_large: 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
    city: 'New York',
    state: 'NY',
    country: 'US',
    gmt_offset: -5,
    market: {
      id: 15,
      name: 'New York, NY'
    },
    category: ''
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
   * determines if the path is valid for station information
   *
   * @param {object} req
   * @return {boolean}
   */
  validPath = (req) => {
    const excludeExt = ['.js', '.css', '.svg', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.gif', '.ico'],
      ext = extname(req.path);

    return !ext || !excludeExt.includes(ext);
  },
  /**
   * determines if the default station should be used
   *
   * @param {object} req
   * @return {boolean}
   */
  getStation = async (req) => {
    if (validPath(req)) {
      const slugInReqUrl = getStationSlug(req),
        response = await radioApiService.get('stations', {page: {size: 999}}, null, { ttl: radioApiService.TTL.DAY });

      // use the stations as a cached object so we don't have to run the same logic every request
      if (!response.response_cached || isEmpty(allStations)) {
        response.data.forEach((station) => {
          const slug = station.attributes.site_slug || station.attributes.callsign || station.id;

          allStations[slug] = station.attributes;
        });
      }

      if (Object.keys(allStations).includes(slugInReqUrl)) {
        return allStations[slugInReqUrl];
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
