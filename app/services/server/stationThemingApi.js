'use strict';

const db = require('./db'),
  log = require('../universal/log').setup({ file: __filename }),
  { findComponentRefInPage } = require('clayutils'),
  _get = require('lodash/get'),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  /**
   * retrieves the current station theme
   *
   * @param {string} siteSlug
   * @return {object}
   */
  get = async (siteSlug) => {
    const key = `${CLAY_SITE_HOST}/_station_themes/${siteSlug}`;

    return await db.get(key);
  },
  /**
   * Add routes for station themes
   *
   * @param {object} app
   * @param {function} checkAuth
   */
  inject = (app, checkAuth) => {
    db.ensureTableExists('station_themes');

    /**
     * Get the current theme for a station
     */
    app.get('/station-theme/:siteSlug', async (req, res) => {
      try {
        const theme = await get(req.params.siteSlug);

        res.status(200).send(theme);
      } catch (e) {
        log('error', e);
        res.status(500).send('There was an error getting the current theme or theme does not exist.');
      }
    });

    /**
     * Add a new station theme
    */
    app.post('/station-theme/:siteSlug', checkAuth, async (req, res) => {
      const theme = req.body,
        key = `${ CLAY_SITE_HOST }/_station_themes/${ req.params.siteSlug }`;

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
    app.put('/station-theme/:siteSlug', checkAuth, async (req, res) => {
      const theme = req.body,
        key = `${ CLAY_SITE_HOST }/_station_themes/${ req.params.siteSlug }`;

      try {
        await db.put(key, theme);

        res.status(200).send(theme);
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error saving the theme.');
      }
    });
  },

  /**
   * Get the published page uri of the station
   *
   * @param {string} stationSlug
   */
  getStationPage = async (stationSlug) => {
    const sql = `
        SELECT  p.id as uri
        FROM  pages p, 
          LATERAL jsonb_array_elements_text(p.data->'main') m(id)
            INNER JOIN components."station-front" sf ON m.id = sf.id
        WHERE  sf.data@>'{"stationSlug": :stationSlug:}'  AND sf.id ~ '@published$'`,
      result = await db.raw(sql, { stationSlug }),
      pageUri = _get(result, 'rows[0].uri');

    if (pageUri) {
      return db.get(pageUri);
    }
  },

  /**
   * Get the station-nav data for the station nav in the page
   *
   * @param {object} pageData
   */
  getStationNav = async pageData => {
    const ref = findComponentRefInPage(pageData, 'station-nav');

    if (ref) {
      return await db.get(ref);
    }
  },

  /**
   * Get the station-footer data for the station-footer in the page
   *
   * @param {object} pageData
   */
  getStationFooter = async pageData => {
    const ref = findComponentRefInPage(pageData, 'station-footer');

    if (ref) {
      return await db.get(ref);
    }
  };

module.exports.inject = inject;
module.exports.get = get;
module.exports.getStationPage = getStationPage;
module.exports.getStationNav = getStationNav;
module.exports.getStationFooter = getStationFooter;
