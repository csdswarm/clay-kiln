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
  * @param {boolean} [param.openOnly=false] retrieve only contests that are currently open (current date is in between start and end date)
  * @param {String} param.stationCallsign
  */
  getContestRules = async ({
    openOnly = false,
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

        -- "AND" will return ONLY the open contests
        -- "OR" will return all 'active' contests (contests that are open, or starting or ending within 1 month)
        ${openOnly ? 'AND' : 'OR'} ( 
          DATE_PART( -- today is after start date
            'day',
            CURRENT_TIMESTAMP - (data ->> 'startDateTime')::timestamp 
          ) > 0
          AND
          DATE_PART( -- today is before end date
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
