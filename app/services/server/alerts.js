'use strict';

const db = require('./db'),
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
   */
  getAlerts = async (params) => {
    await db.ensureTableExists('alert');

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
      alerts = db.raw(query, paramValues)
        .then(pullDataFromResponse);

    return alerts;
  };

module.exports = { getAlerts };
