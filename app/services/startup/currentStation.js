'use strict';

const { lstatSync, readdirSync } = require('fs'),
  { join } = require('path'),
  isDirectory = source => lstatSync(source).isDirectory(),
  getDirectories = source =>
    readdirSync(source).map(name => join(source, name)).filter(isDirectory),
  { getComponentName, isComponent, isPage, isPageMeta } = require('clayutils'),
  _get = require('lodash/get'),
  log = require('../universal/log').setup({ file: __filename }),
  { getFullOriginalUrl, urlToUri } = require('../universal/utils'),
  stationUtils = require('../server/station-utils'),
  { contentTypes } = require('../universal/constants'),
  db = require('../server/db'),
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
    timezone: 'ET',
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
    const stationPath = req.originalUrl.split('/')[1],
      stationHost = req.get('host').split('/').shift().split('.').shift().toLowerCase();

    return ['www', 'clay', 'dev-clay', 'stg-clay'].includes(stationHost) ? stationPath.toLowerCase() : stationHost.toLowerCase();
  },
  /**
   * returns whether the request is for a content component
   *
   * @param {string} url
   * @returns {boolean}
   */
  isContentComponent = url => {
    const componentName = getComponentName(url);

    return isComponent(url)
      && contentTypes.has(componentName);
  },
  /**
   * fetches the main component's data in the page and returns the 'stationSlug'
   *   property or an empty string.
   *
   * @param {string} uri - the page uri
   * @returns {string}
   */
  getStationSlugFromPage = async uri => {
    let mainComponentUri;

    try {
      mainComponentUri = _get(await db.get(uri), 'main[0]', '');
    } catch (err) {
      logUnexpectedDbError(uri, err);
    }

    return mainComponentUri
      ? getStationSlugFromComponent(mainComponentUri)
      : '';
  },
  /**
   * Logs the error if something happened besides the result not being found
   *
   * @param {string} uri
   * @param {Error} err
   */
  logUnexpectedDbError = (uri, err) => {
    if (!err.message.startsWith('No result found')) {
      log('error', 'Error getting the data from uri: ' + uri, err);
    }
  },
  /**
   * fetches the component data and returns the 'stationSlug' property or an
   *   empty string.
   *
   * @param {string} uri
   * @returns {string}
   */
  getStationSlugFromComponent = async uri => {
    let result = '';

    try {
      result = _get(await db.get(uri), 'stationSlug', '');
    } catch (err) {
      logUnexpectedDbError(uri, err);
    }
    return result;
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
   * @param {object} allStations
   * @return {object}
   */
  getStation = async (req, allStations) => {
    if (!validPath(req)) {
      return {};
    }

    const slugInReqUrl = getStationSlug(req),
      stationId = req.query.stationId,
      url = getFullOriginalUrl(req);

    let stationSlug = '';

    if (allStations.bySlug.hasOwnProperty(slugInReqUrl)) {
      stationSlug = slugInReqUrl;
    } else if (stationId && allStations.byId.hasOwnProperty(stationId)) {
      stationSlug = allStations.byId[stationId].attributes.site_slug;
    } else if (isPage(url) && !isPageMeta(url)) {
      stationSlug = await getStationSlugFromPage(urlToUri(url));
    } else if (isContentComponent(url)) {
      stationSlug = await getStationSlugFromComponent(urlToUri(url));
    }

    return _get(
      allStations,
      `bySlug[${stationSlug}].attributes`,
      DEFAULT_STATION
    );
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

  res.locals.station = await getStation(req, allStations);
  res.locals.allStationsCallsigns = Object.keys(allStations.byCallsign);
  res.locals.allStationsSlugs = Object.keys(allStations.bySlug);
  res.locals.defaultStation = defaultStation;

  return next();
};
