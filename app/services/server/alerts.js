'use strict';

const db = require('../server/db'),
  /**
   * Transform Postgres response into just data
   *
   * @param {object} response
   * @returns {array}
   */
  pullDataFromResponse = (response) => response.rows.map(row => row.data),
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
        `).then(pullDataFromResponse);

        res.status(200).send(alerts);
      } catch (e) {
        res.status(500).send('There was an error getting current alerts');
      }
    });
  };

module.exports.inject = inject;
