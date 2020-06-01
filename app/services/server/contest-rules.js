'use strict';

const db = require('../../services/server/db'),
  /**
  * Creates a conditional station operator for contest sql query
  * @param {String} stationCallsign
  * @returns {String}
  */
  stationQuery = stationCallsign => `AND data->>'stationCallsign' = '${stationCallsign}'`,
  /**
  * Queries the db for contest rules
  * @param {String} param.stationCallsign
  */
  getContestRules = async ({
    stationCallsign = ''
  }) => {
    const contestRulesQuery = /* sql */ `
      SELECT *
      FROM components."contest"

      WHERE (
        -- ending within 30 days from now or ended within 31 days ago
        DATE_PART(
          'day',
          CURRENT_TIMESTAMP - (data ->> 'endDateTime')::timestamp
        ) BETWEEN -30 and 31

        -- currently active
        OR (
          DATE_PART(
            'day',
            CURRENT_TIMESTAMP - (data ->> 'startDateTime')::timestamp
          ) > 0
          AND
          DATE_PART(
            'day',
            (data ->> 'endDateTime')::timestamp - CURRENT_TIMESTAMP
          ) > 0
        )
      )

      AND id SIMILAR TO '%@published'
      ${stationQuery(stationCallsign)}
    `,

      { rows } = await db.raw(contestRulesQuery),
      pluckData = ({ data }) => data;

    return rows.map(pluckData);
  };

module.exports.getContestRules = getContestRules;
