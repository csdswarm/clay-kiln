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
    SELECT cc.id, cc.data FROM components."contest" cc
    JOIN pages p ON cc.data->>'canonicalUrl' = p.meta->>'url'
    WHERE 
    -- shows all the contests including those past 31 days after they ended.
      DATE((cc.data ->> 'endDateTime')::timestamp) >= DATE(CURRENT_DATE - INTERVAL '31 day')
    OR 
    -- show all active contests
      CURRENT_DATE <= DATE(((cc.data ->> 'endDateTime')::timestamp))
    
      ${stationQuery(stationCallsign)}
    `,

      { rows } = await db.raw(contestRulesQuery),
      pluckData = ({ data }) => data;

    return rows.map(pluckData);
  };

module.exports.getContestRules = getContestRules;
