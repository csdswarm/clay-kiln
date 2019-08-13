'use strict';

const db = require('./db'),
  log = require('../universal/log').setup({ file: __filename }),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  /**
   * Add routes for station themes
   *
   * @param {object} app
   */
  inject = (app) => {
    db.ensureTableExists('station_themes');

    /**
     * Get the current theme for a station
     */
    app.get('/station-theme/:siteSlug/:stationID', async (req, res) => {
      const key = `${ CLAY_SITE_HOST }/_station_themes/${ req.params.stationID }`;

      try {
        const theme = await db.get(key);

        res.status(200).send(theme);
      } catch (e) {
        log('error', e);
        res.status(500).send('There was an error getting the current theme or theme does not exist.');
      }
    });

    /**
     * Add a new station theme
    */
    app.post('/station-theme/:siteSlug', async (req, res) => {
      const { stationID, ...theme } = req.body,
        key = `${ CLAY_SITE_HOST }/_station_themes/${ stationID }`;

      try {
        await db.post(key, theme);

        res.status(200).send(theme);
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error saving the theme.');
      }
    });

    /**
     * Update a station theme
    */
    app.put('/station-theme/:siteSlug', async (req, res) => {
      const { stationID, ...theme } = req.body,
        key = `${ CLAY_SITE_HOST }/_station_themes/${ stationID }`;

      try {
        await db.put(key, theme);

        res.status(200).send(theme);
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error saving the theme.');
      }
    });
  };

module.exports.inject = inject;
