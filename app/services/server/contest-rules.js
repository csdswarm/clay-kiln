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
    stationCallsign = '',
    // Modifies the query to shows all the contests including those past 31 days after they ended
    //  or only show all active contests
    openOnly = false
  }) => {
    const contestRulesQuery = /* sql */ `
    SELECT cc.id, cc.data FROM components."contest" cc
    JOIN pages p ON cc.data->>'canonicalUrl' = p.meta->>'url'
    WHERE 
    ${ openOnly
    ? "CURRENT_DATE <= DATE(((cc.data ->> 'endDateTime')::timestamp)) "
    : "DATE((cc.data ->> 'endDateTime')::timestamp) >= DATE(CURRENT_DATE - INTERVAL '31 day') "}
      ${stationQuery(stationCallsign)} 
      ORDER BY cc.data ->> 'startDateTime' ASC;
    `,

      { rows } = await db.raw(contestRulesQuery),
      pluckData = ({ data }) => data;

    return rows.map(pluckData);
  };

module.exports.getContestRules = getContestRules;
