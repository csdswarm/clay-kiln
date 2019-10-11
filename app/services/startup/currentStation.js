'use strict';

const radioApiService = require('../../services/server/radioApi'),
  { isEmpty } = require('lodash'),
  { lstatSync, readdirSync } = require('fs'),
  { join } = require('path'),
  isDirectory = source => lstatSync(source).isDirectory(),
  getDirectories = source =>
    readdirSync(source).map(name => join(source, name)).filter(isDirectory),
  allStations = {},
  allStationsIds = {},
  allStationsCallsigns = [],
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
   * invalid paths are as follows:
   *  Paths to files (has extension)
   *  Paths to components that do not include a stationId query
   *
   * @param {object} req
   * @return {boolean}
   */
  validPath = (req) => {
    const publicDirs = getDirectories('./public/'),
      stationsList = req.path.includes('_components') && !req.query.stationId || false;

    return !stationsList && publicDirs.every(publicPathDir => req.path.indexOf(publicPathDir.replace('public', '')) !== 0);
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
        stationId = req.query.stationId,
        response = await radioApiService.get('stations', { page: { size: 1000 } }, null, { ttl: radioApiService.TTL.MIN * 30 });

      // use the stations as a cached object so we don't have to run the same logic every request
      if (response.response_cached === false || isEmpty(allStations)) {
        response.data.forEach((station) => {
          const slug = station.attributes.site_slug || station.attributes.callsign || station.id;

          allStations[slug] = station.attributes;
          allStationsIds[station.id] = slug;
          allStationsCallsigns.push(station.attributes.callsign);
        });
      }

      if (Object.keys(allStations).includes(slugInReqUrl)) {
        return allStations[slugInReqUrl];
      }

      // If the station isn't in the slug, look for the querystring parameter
      if (stationId && Object.keys(allStationsIds).includes(stationId)) {
        return allStations[allStationsIds[stationId]];
      }

      return defaultStation;
    }

    return {};
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
  res.locals.allStationsCallsigns = allStationsCallsigns;
  res.locals.defaultStation = defaultStation;

  return next();
};
