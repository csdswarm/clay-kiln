'use strict';

const _ = require('lodash'),
  stationUtils = require('../../station-utils'),
  urps = require('../../../universal/urps'),
  { DEFAULT_STATION } = require('../../../universal/constants'),
  { refreshPath } = require('../../../../routes/add-endpoints/refresh-permissions'),
  googleOverridesPermissions = process.env.GOOGLE_OVERRIDES_PERMISSIONS === 'true';

/**
 * 'trimmed' refers to the fact that we don't include all the station properties
 *   in the values, only the ones we use.
 *
 * @typedef {object} TrimmedStation
 * @property {string} callsign
 * @property {string} name
 * @property {string} slug - (site_slug)
 */

/**
 * radio.com doesn't exist in the radio api so we need to add it explicitly
 *
 * @param {object} stationsBySlug - this is mutated
 */
function addRdcStation(stationsBySlug) {
  Object.assign(stationsBySlug, {
    [DEFAULT_STATION.site_slug]: {
      callsign: DEFAULT_STATION.callsign,
      name: DEFAULT_STATION.name,
      slug: DEFAULT_STATION.site_slug
    }
  });
}

/**
 * @param {object} req - express request object
 * @param {object} locals
 * @param {function} getStationDomainNames - the urps function which takes a jwt
 *   and returns the domain names depending on the permissions asked of urps.
 *   For instance stations-i-can-import-content asks for all station domain
 *   names which the user can import content into.
 *
 * @returns {object}
 * returns an object with the schema {
 *   [site_slug]: {TrimmedStation}
 * }
 */
async function getTrimmedStationsViaUrps(req, locals, getStationDomainNames) {
  const [allStations, stationDomainNames] = await Promise.all([
      stationUtils.getAllStations({ locals }),
      getStationDomainNames(req.session.auth)
    ]),
    allStationsByDomainName = allStations.asArray.reduce(
      (res, aStation) => {
        res[urps.getStationDomainName(aStation)] = aStation;
        return res;
      },
      {}
    ),
    stationsByDomainName = _.pick(
      allStationsByDomainName,
      stationDomainNames
    ),
    stationsBySlug = _.chain(stationsByDomainName)
      .mapKeys('site_slug')
      .mapValues(({ callsign, name, site_slug }) => {
        return {
          callsign,
          name,
          slug: site_slug
        };
      })
      .value();

  if (stationDomainNames.includes(DEFAULT_STATION.urpsDomainName)) {
    addRdcStation(stationsBySlug);
  }

  return stationsBySlug;
}

/**
 * this is used for when google accounts have permissions override turned on.
 *
 * @param {object} locals
 * @returns {object}
 * returns an object with the schema {
 *   [site_slug]: {TrimmedStation}
 * }
 */
async function getAllTrimmedStations(locals) {
  let stationsBySlug = await stationUtils.getAllStations.bySlug({ locals });

  stationsBySlug = _.mapValues(
    stationsBySlug,
    ({ callsign, name, site_slug }) => ({
      callsign,
      name,
      slug: site_slug
    })
  );

  addRdcStation(stationsBySlug);

  return stationsBySlug;
}

/**
 * @param {object} locals
 * @returns {boolean}
 */
function shouldAddToLocals(locals) {
  const provider = _.get(locals, 'user.provider', '');

  return provider === 'cognito'
    || (
      provider === 'google'
      && googleOverridesPermissions
    );
}

/**
 * returns whether the request is to GET /rdc/refresh-permissions
 * @param {object} req - express request
 * @returns {boolean}
 */
function isRefreshingPermissions(req) {
  return req.method === 'GET'
    && req.path === refreshPath;
}

module.exports = {
  getAllTrimmedStations,
  getTrimmedStationsViaUrps,
  isRefreshingPermissions,
  shouldAddToLocals
};
