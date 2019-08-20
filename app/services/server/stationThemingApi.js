'use strict';

const db = require('./db'),
  log = require('../universal/log').setup({ file: __filename }),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  /**
   * retrieves the current station theme
   *
   * @param {number} stationId
   * @return {object}
   */
  get = async (stationId) => {
    const key = `${CLAY_SITE_HOST}/_station_themes/${stationId}`;

    return await db.get(key);
  },
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
      try {
        const theme = await get(req.params.stationID);

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
module.exports.get = get;
