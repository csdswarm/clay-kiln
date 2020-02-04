'use strict';
/* eslint-disable one-var */

const url = require('url');
const _get = require('lodash/get');
const db = require('../../services/server/db');
const moment = require('moment');
const queryDateRange = 30;
const { unityComponent } = require('../../services/universal/amphora');
const stationQuery = (stationCallsign) => {
  const callsignUpper = stationCallsign.toUpperCase();

  return /* sql */`
      AND data @> '{"stationCallsign": "${callsignUpper}"}'
  `;
};
const getContestRules = async ({
  startTime = '',
  stationCallsign = ''
}) => {
  const contestRulesQuery = /* sql */ `
    SELECT *
    FROM components."contest"

    -- make sure contest has already started
    WHERE data->>'startDateTime' <= '${startTime}'

    -- show contests that are within 30 days from start time
    AND DATE_PART(
      'day',
      (data ->> 'endDateTime')::timestamp - '${startTime}'::timestamp
    ) <= ${queryDateRange}

    AND id ~ '@published$'
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

    return Object.assign(data, {
      _computed: {
        contestRules,
        pageTitle: isPresentationMode ?
          'Contests' :
          'Contest Rules'
      }
    });
  }
});
