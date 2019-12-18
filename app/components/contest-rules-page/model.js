'use strict';
/* eslint-disable one-var */

const _get = require('lodash/get');
const db = require('amphora-storage-postgres');
const moment = require('moment');
const queryDateRange = 30;
const stationQuery = stationCallsign =>
  stationCallsign ?
    `AND data->>'stationCallsign' = '${stationCallsign.toUpperCase()}'` :
    '';
const getContestRules = async ({
  startTime = '',
  stationCallsign = ''
}) => {
  const contestRulesQuery = /* sql */`
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

module.exports.render = async (ref, data, locals) => {
  const stationSlug = _get(locals, 'params.stationSlug');
  const stationCallsign = stationSlug || '';
  const startTime = moment().toISOString(true);
  const contestRules = (await getContestRules({
    startTime,
    stationCallsign
  })).map((ruleData) => ({
    ...ruleData,
    stationTimeZone: locals.station.timezone,
    showHeader: true
  }));

  data._computed = {
    contestRules
  };

  return data;
};
