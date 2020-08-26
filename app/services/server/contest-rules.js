'use strict';

const db = require('../../services/server/db'),
  /**
  * Creates a conditional station operator for contest sql query
  * @param {String} stationCallsign
  * @returns {String}
  */
  stationQuery = stationCallsign => `AND cc.data->>'stationCallsign' = '${stationCallsign}'`,
  /**
  * Queries the db for contest rules
  * @param {String} param.stationCallsign
  */
  getContestRules = async ({
    stationCallsign = ''
  }) => {
    const contestRulesQuery = /* sql */ `
    SELECT cc.id, cc.data
    FROM components."contest" cc
      JOIN pages p ON cc.data->>'canonicalUrl' = p.meta->>'url'

    WHERE (
      -- ending within 30 days from now or ended within 31 days ago
      DATE_PART(
        'day',
        CURRENT_TIMESTAMP - (cc.data ->> 'endDateTime')::timestamp
      ) BETWEEN -30 and 31

      -- currently active
      OR (
        DATE_PART(
          'day',
          CURRENT_TIMESTAMP - (cc.data ->> 'startDateTime')::timestamp
        ) > 0
        AND
        DATE_PART(
          'day',
          (cc.data ->> 'endDateTime')::timestamp - CURRENT_TIMESTAMP
        ) > 0
      )
    )
      ${stationQuery(stationCallsign)}
    `,

      { rows } = await db.raw(contestRulesQuery),
      pluckData = ({ data }) => data;

    return rows.map(pluckData);
  };

module.exports.getContestRules = getContestRules;
