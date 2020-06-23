'use strict';

const db = require('./db'),
  { addAmphoraRenderTime } = require('../universal/utils'),
  /**
   * Transform Postgres response into just data
   *
   * @param {object} response
   * @returns {array}
   */
  pullDataFromResponse = (response) => response.rows.map(({ id, data }) => ({ id, ...data })),
  /**
   * Get the current alerts for a station directly from the db
   *
   * @param {Object} params
   * @param {Bool} params.active
   * @param {Bool} params.current
   * @param {String} params.station
   * @param {object} [locals]
   * @param {object} [argObj]
   * @param {boolean} [argObj.shouldAddAmphoraTimings]
   * @param {string} [argObj.amphoraTimingLabelPrefix]
   */
  getAlerts = async (params, locals, argObj = {}) => {
    const {
        shouldAddAmphoraTimings = false,
        amphoraTimingLabelPrefix
      } = argObj,
      beforeEnsureTable = new Date();

    try {
      await db.ensureTableExists('alert');
    } finally {
      addAmphoraRenderTime(
        locals,
        {
          data:  { station: params.station },
          label: 'alerts.js -> ensure table exists',
          ms: new Date() - beforeEnsureTable
        },
        {
          prefix: amphoraTimingLabelPrefix,
          shouldAdd: shouldAddAmphoraTimings
        });
    }

    const dbQueryParams = {
        active: true,
        ...params
      },
      paramValues = [],
      whereQuery = Object.entries(dbQueryParams)
        .map(([key, value]) => {
          switch (key) {
            case 'current':
              return "NOW() AT TIME ZONE 'UTC' <@ tsrange((data->>'start')::timestamp, (data->>'end')::timestamp)";
            default:
              paramValues.push(value);
              return `data->>'${key}' = ?`;
          }
        }).join(' AND '),
      query = `
        SELECT id, data
        FROM alert
        WHERE (data->>'end')::timestamp > NOW() AT TIME ZONE 'UTC'
          AND ${whereQuery}
        ORDER BY data->>'start'
      `,
      beforeQuery = new Date();

    let alerts;
    
    try {
      alerts = await db.raw(query, paramValues).then(pullDataFromResponse);
    } finally {
      addAmphoraRenderTime(
        locals,
        {
          data:  { station: params.station },
          label: 'alerts.js -> alerts query',
          ms: new Date() - beforeQuery
        },
        {
          prefix: amphoraTimingLabelPrefix,
          shouldAdd: shouldAddAmphoraTimings
        });
    }

    return alerts;
  };

module.exports = { getAlerts };
