/**
 * const contestOverdue = currentTime - contestEndtTime
 *
 * return contestOverdue < 30days
 */

'use strict';
/* eslint-disable one-var */

const { unityComponent } = require('../../services/universal/amphora');
const db = require('amphora-storage-postgres');
const defaultStation = require('../../services/startup/currentStation/default-station');
const moment = require('moment');
const maxAgeInDays = 31;
const url = require('url');
const _get = require('lodash/get');


/**
 * Creates a conditional station operator for contest sql query
 * @param {String} stationCallsign
 * @returns {String}
 */
const stationQuery = stationCallsign =>
  stationCallsign === defaultStation.callsign ?
    'AND NOT data \\? \'stationCallsign\'' :
    `AND data->>'stationCallsign' = '${stationCallsign}'`;

/**
 * Queries the db for contest rules
 * @param {String} param.startTime
 * @param {String} param.stationCallsign
 */
const getContestRules = async ({
  startTime = '',
  stationCallsign = ''
}) => {
  const contestRulesQuery = /* sql */ `
    SELECT *
    FROM components."contest-rules"

    -- show contests that are no more than X days old
    WHERE DATE_PART(
      'day',
      '${startTime}'::timestamp - (data ->> 'contestEndDate')::timestamp
    ) <= ${maxAgeInDays}

    AND id SIMILAR TO '%@published'
    ${stationQuery(stationCallsign)}
  `;

  const { rows } = await db.raw(contestRulesQuery);
  const pluckData = ({ data }) => data;

  return rows.map(pluckData);
};

module.exports = unityComponent({
  render: async (ref, data, locals = {}) => {
    // NOTE: locals is undefined during migration/bootstrap
    const callsign = _get(locals, 'stationForPermissions.callsign');
    const { pathname } = url.parse(locals.url);
    const isPresentationMode = pathname === '/contests';
    const startTime = moment().toISOString(true);
    const contestRules = (await getContestRules({
      startTime,
      stationCallsign: callsign
    })).map((ruleData) => ({
      ...ruleData,
      stationTimeZone: locals.station.timezone,
      showHeader: true,
      showPresentation: isPresentationMode
    }));

    data._computed = {
      contestRules
    };

    return data;
  }
});
