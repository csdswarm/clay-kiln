'use strict';
/* eslint-disable one-var */

const { unityComponent } = require('../../services/universal/amphora');
const db = require('amphora-storage-postgres');
const defaultStation = require('../../services/startup/currentStation/default-station');
const moment = require('moment');
const queryDateRange = 30;
const url = require('url');
const _get = require('lodash/get');

const stationQuery = stationCallsign =>
  stationCallsign === defaultStation.callsign ?
    'AND NOT data \\? \'stationCallsign\'' :
    `AND data->>'stationCallsign' = '${stationCallsign}'`;

const getContestRules = async ({
  startTime = '',
  stationCallsign = ''
}) => {
  const contestRulesQuery = /* sql */ `
    SELECT *
    FROM components."contest-rules"

    -- make sure contest has already started
    WHERE data->>'contestStartDate' <= '${startTime}'

    -- show contests that are within 30 days from start time
    AND DATE_PART(
      'day',
      (data ->> 'contestEndDate')::timestamp - '${startTime}'::timestamp
    ) <= ${queryDateRange}

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
      contestRules,
      pageTitle: isPresentationMode ?
        'Contests' :
        'Contest Rules'
    };

    return data;
  }
});
