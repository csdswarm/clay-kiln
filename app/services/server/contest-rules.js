'use strict';

const db = require('../../services/server/db'),
  dateRange = 30,
  stationQuery = (stationCallsign) => {
    const callsignUpper = stationCallsign.toUpperCase();

    return /* sql */`
    AND data @> '{"stationCallsign": "${callsignUpper}"}'
`;
  },
  getContestRules = async ({
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
  ) <= ${dateRange}

  AND id ~ '@published$'
  ${stationQuery(stationCallsign)}
`,

      { rows } = await db.raw(contestRulesQuery),
      pluckData = ({ data }) => data;

    return rows.map(pluckData);
  };

module.exports.getContestRules = getContestRules;
