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
    site_slug: 'www',
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
    category: '',
    phonetic_name: 'radio dot com',
    slogan: 'Bringing radio alive',
    twitter: 'radiodotcom',
    facebook: 'https://www.facebook.com/radiodotcom',
    youtube: 'https://www.youtube.com/user/radiodotcom',
    instagram: 'https://www.instagram.com/radiodotcom'
  },
  /**
   * returns the slug of the site either from a subdomain or as the first element of the path
   *
   * @param {object} req
   * @return {string}
   */
  getStationSlug = (req) => {
    const [, stationPath] = req.originalUrl.split('?')[0].split('/'),
      stationHost = req.get('host').split('/').shift().split('.').shift().toLowerCase();

    return ['www', 'clay', 'dev-clay', 'stg-clay'].includes(stationHost) ? stationPath.toLowerCase() : stationHost.toLowerCase();
  },
  /**
   * determines if the path is valid for station information
   *
   * @param {object} req
   * @return {boolean}
   */
  validPath = (req) => {
    const publicDirs = getDirectories('./public/');

    return publicDirs.every(publicPathDir => req.path.indexOf(publicPathDir.replace('public', '')) !== 0);
  },
  /**
   * find the station by slug or id
   *
   * @param {string} slugInReqUrl
   * @param {string} stationId
   *
   * @return {object}
   */
  findStation = async (slugInReqUrl, stationId) => {
    let slug = slugInReqUrl;

    // If the station isn't in the slug, look for it by stationId
    if (!Object.keys(allStations).includes(slugInReqUrl) && Object.keys(allStationsIds).includes(stationId)) {
      slug = allStationsIds[stationId];
    }

    // verify the slug is valid
    if (Object.keys(allStations).includes(slug)) {
      const station = allStations[slug];

      return station;
    }

    return null;
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
        response = await radioApiService.get('stations', {page: {size: 999}}, null, { ttl: radioApiService.TTL.DAY });

      // use the stations as a cached object so we don't have to run the same logic every request
      if (!response.response_cached || isEmpty(allStations)) {
        response.data.forEach((station) => {
          const slug = station.attributes.site_slug || station.attributes.callsign || station.id;

          allStations[slug] = station.attributes;
          allStationsIds[station.id] = slug;
          allStationsCallsigns.push(station.attributes.callsign);
        });
      }

      // eslint-disable-next-line one-var
      const station = await findStation(slugInReqUrl, stationId);

      return station || defaultStation;
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
  const station = await getStation(req);

  res.locals.allStationsCallsigns = allStationsCallsigns;
  res.locals.allStationsSlugs = Object.keys(allStations);
  res.locals.defaultStation = defaultStation;
  res.locals.station = station || {};

  return next();
};
