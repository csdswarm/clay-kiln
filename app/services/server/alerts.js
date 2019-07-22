'use strict';

const db = require('../server/db'),
  uuidV4 = require('uuid/v4'),
  _pick = require('lodash/pick'),
  log = require('../universal/log').setup({file: __filename}),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  /**
   * Transform Postgres response into just data
   *
   * @param {object} response
   * @returns {array}
   */
  pullDataFromResponse = (response) => response.rows.map(({id, data}) => ({id, ...data})),
  /**
   * Checks if the start and end times for an alert overlap with any other alert
   *
   * @param {string} start
   * @param {string} end
   * @param {string} station
   *
   * @returns {boolean}
   */
  checkForOverlap = async (start, end, station) => {
    const response = await db.raw(`
        SELECT id FROM alert
        WHERE tsrange(?, ?)
            && tsrange((data->>'start')::timestamp, (data->>'end')::timestamp)
            AND data->>'active' = 'true'
            AND data->>'station' = ?
    `, [start, end, station]);

    return response.rowCount > 0;
  },
  /**
   * Add routes for alerts
   *
   * @param {object} app
   */
  inject = (app) => {
    db.ensureTableExists('alert');
    /**
     * Get the current alerts for a station
     */
    app.get('/alerts', async (req, res) => {
      const allowedParams = ['active', 'current', 'station'];

      try {
        const params = _pick({active: true, ...req.query}, allowedParams),
          paramValues = [],
          whereQuery = Object.keys(params).map(key => {
            switch (key) {
              case 'current':
                return "NOW() AT TIME ZONE 'UTC' <@ tsrange((data->>'start')::timestamp, (data->>'end')::timestamp)";
              default:
                paramValues.push(params[key]);
                return `data->>'${key}' = ?`;
            }
          }).join(' AND '),
          alerts = await db.raw(`
            SELECT id, data
            FROM alert
            WHERE (data->>'end')::timestamp > NOW() AT TIME ZONE 'UTC'
              AND ${whereQuery}
            ORDER BY data->>'start'
          `, paramValues).then(pullDataFromResponse);

        res.status(200).send(alerts);
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error getting current alerts');
      }
    });

    /**
     * Add a new alert
     */
    app.post('/alerts', async (req, res) => {
      const alert = req.body,
        key = `${CLAY_SITE_HOST}/_alert/${uuidV4()}`,
        overlap = await checkForOverlap(alert.start, alert.end, alert.station);

      if (overlap) {
        return res.status(400).send('Cannot save this alert. Its start and end times overlap with another alert');
      }

      try {
        await db.post(key, {...alert, active: true});

        res.status(200).send(key);
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error saving the alert');
      }
    });

    /**
     * Update an alert
     */
    app.put('/alerts', async (req, res) => {
      const {id: key, ...alert} = req.body,
        overlap = await checkForOverlap(alert.start, alert.end, alert.station);

      if (alert.active && overlap) {
        return res.status(400).send('Cannot save this alert. Its start and end times overlap with another alert');
      }

      try {
        await db.put(key, alert);

        res.status(200).send({key, ...alert});
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error saving the alert');
      }
    });
  };

module.exports.inject = inject;
