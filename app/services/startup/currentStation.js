'use strict';

const { extname } = require('path'),
  stationUtils = require('../server/station-utils'),
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
    const stationPath = req.originalUrl.split('/')[1],
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
   * @param {object} allStations
   * @return {object}
   */
  getStation = (req, allStations) => {
    if (!validPath(req)) {
      return;
    }

    const slugInReqUrl = getStationSlug(req),
      stationId = req.query.stationId;

    if (allStations.bySlug.hasOwnProperty(slugInReqUrl)) {
      return allStations.bySlug[slugInReqUrl];
    } else if (stationId && allStations.byId.hasOwnProperty(stationId)) {
      return allStations.byId[stationId];
    } else {
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
  const allStations = await stationUtils.getAllStations();

  res.locals.station = getStation(req, allStations);
  res.locals.allStationsCallsigns = Object.keys(allStations.byCallsign);
  res.locals.defaultStation = defaultStation;

  return next();
};
