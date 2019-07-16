'use strict';

const db = require('../server/db'),
  uuidV4 = require('uuid/v4'),
  log = require('../universal/log').setup({file: __filename}),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  /**
   * Transform Postgres response into just data
   *
   * @param {object} response
   * @returns {array}
   */
  pullDataFromResponse = (response) => response.rows.map(row => row.data),
  checkForOverlap = async (start, end) => {
    await db.ensureTableExists('alert');
    const response = await db.raw(`
        SELECT id FROM alert
        WHERE int8range(${start}::int8, ${end}::int8)
            && int8range((data->>'start')::int8, (data->>'end')::int8)
    `);

    return response.rowCount > 0;
  },
  /**
   * Add routes for alerts
   *
   * @param {object} app
   */
  inject = (app) => {
    /**
     * Get the current alerts for a station
     */
    app.get('/alerts', async (req, res) => {
      try {
        const alerts = await db.raw(`
            SELECT data
            FROM alert
            WHERE to_timestamp(((data->>'end')::int8)/1000) > NOW()
            ORDER BY data->>'start'
        `).then(pullDataFromResponse);

        res.status(200).send(alerts);
      } catch (e) {
        log(e.message);
        res.status(500).send('There was an error getting current alerts');
      }
    });

    /**
     * Add a new alert
     */
    app.post('/alerts', async (req, res) => {
      const alert = req.body,
        key = `${CLAY_SITE_HOST}/_alert/${uuidV4()}`,
        overlap = await checkForOverlap(alert.start, alert.end);

      if (overlap) {
        return res.status(500).send('Cannot save this alert. Its start and end times overlap with another alert');
      }

      try {
        await db.post(key, alert);

        res.status(200).send(key);
      } catch (e) {
        log(e.message);
        res.status(500).send('There was an error saving the alert');
      }
    });
  };

module.exports.inject = inject;
