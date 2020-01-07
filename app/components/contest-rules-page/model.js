'use strict';
/* eslint-disable one-var */

const db = require('amphora-storage-postgres');
const moment = require('moment');
const url = require('url');
const defaultStation = require('../../services/startup/currentStation/default-station');
const queryDateRange = 30;

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

module.exports.render = async (ref, data, locals) => {
  const { pathname } = url.parse(locals.url);
  const { stationForPermissions } = locals;
  const { callsign } = stationForPermissions;
  const startTime = moment().toISOString(true);
  const isPresentationMode = pathname === '/contests';
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
      'Contests' : 'Contest Rules'
  };

  return data;
};
