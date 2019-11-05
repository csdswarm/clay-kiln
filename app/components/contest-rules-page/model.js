'use strict';
/* eslint-disable one-var */

const _get = require('lodash/get');
const db = require('amphora-storage-postgres');
const moment = require('moment');
const CO_NAME = 'RADIO.COM';
const queryDateRange = 30;
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
    AND data->>'stationCallsign' = '${stationCallsign.toUpperCase()}'
  `;
  const { rows } = await db.raw(contestRulesQuery);
  const pluckData = ({ data }) => data;

  return rows.map(pluckData);
};

module.exports.render = async (ref, data, locals) => {
  const stationSlug = _get(locals, 'params.stationSlug');
  const {
    defaultStation: {
      callsign: defaultCallsign
    },
    station: stationInfo
  } = locals;
  const stationCallsign = stationSlug || defaultCallsign;
  const isDefaultStation = stationCallsign === defaultCallsign;
  const stationName = isDefaultStation ? CO_NAME : stationInfo.name;
  const startTime = moment().toISOString(true);
  const contestRules = (await getContestRules({
    startTime,
    stationCallsign
  })).map((ruleData) => ({
    ...ruleData,
    stationTimeZone: locals.station.timezone,
    showHeader: true
  }));
  const rulesUrlSubDomain = isDefaultStation ? 'www' : stationSlug;

  console.log('[CONTEST RULES QUERY]', stationCallsign, stationName, locals.station);

  return Object.assign(data, {
    contestRules,
    stationMeta: {
      rulesUrlSubDomain,
      name: stationName
    }
  });
};
