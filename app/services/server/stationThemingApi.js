'use strict';

const db = require('./db'),
  log = require('../universal/log').setup({file: __filename}),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  /**
   * Add routes for station themes
   *
   * @param {object} app
   */
  inject = (app) => {
    /**
     * Get the current alerts for a station
     */
    app.get('/station-theme/:stationID', async (req, res) => {
      const key = `${CLAY_SITE_HOST}/_station-theme/${ req.params.stationID }`;

      try {
        const theme = await db.get(key);

        res.status(200).send({ key, ...theme });
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error getting the current theme');
      }
    });

    /**
     * Add a new alert
    */
    app.post('/station-theme/:stationID', async (req, res) => {
      const key = `${CLAY_SITE_HOST}/_station-theme/${ req.params.stationID }`,
        theme = req.body;

      try {
        await db.post(key, ...theme);

        res.status(200).send(key);
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error saving the theme');
      }
    });

    /**
     * Update an alert
    */
    app.put('/station-theme/:stationID', async (req, res) => {
      const key = `${CLAY_SITE_HOST}/_station-theme/${ req.params.stationID }`,
        theme = req.body;

      try {
        await db.put(key, theme);

        res.status(200).send({key, ...theme});
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error saving the theme');
      }
    });
  };

module.exports.inject = inject;
