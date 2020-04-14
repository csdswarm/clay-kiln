'use strict';

const db = require('../server/db'),
  uuidV4 = require('uuid/v4'),
  _pick = require('lodash/pick'),
  log = require('../universal/log').setup({ file: __filename }),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  checkEndsBeforeStart = (start, end) => new Date(end) < new Date(start),
  checkEndsInPast = end => new Date(end) < Date.now(),
  /**
   * Transform Postgres response into just data
   *
   * @param {object} response
   * @returns {array}
   */
  pullDataFromResponse = (response) => response.rows.map(({ id, data }) => ({ id, ...data })),
  /**
   * Checks if the start and end times for an alert overlap with any other alert
   *
   * @param {string} start
   * @param {string} end
   * @param {string} station
   * @param {string} key
   * @returns {boolean}
   */
  checkForOverlap = async (start, end, station, key) => {
    const onlyCurrentEntries = '(data->>\'end\')::timestamp > NOW()',
      onlyActiveEntries = 'data->>\'active\' = \'true\'',
      onlyEntriesWithinSameStation = 'data->>\'station\' = ?',
      entriesWhoseTimeRangeOverlapTheSavedEntry =
        'tsrange(?, ?) && tsrange((data->>\'start\')::timestamp, (data->>\'end\')::timestamp)',
      exceptTheEntryBeingSaved = 'id != ?',
      response = await db.raw(`
      SELECT id FROM alert
      WHERE ${onlyCurrentEntries}
        AND ${onlyActiveEntries}
        AND ${onlyEntriesWithinSameStation}
        AND ${entriesWhoseTimeRangeOverlapTheSavedEntry}
        AND ${exceptTheEntryBeingSaved}`,
      [station, start, end, key]);

    return response.rowCount > 0;
  },
  /**
   * Validate an alert
   *
   * @param {string} key
   * @param {Object} alert
   */
  validate = async (key, alert) => {
    const { start, end, station } = alert;

    try {
      if (checkEndsBeforeStart(start, end)) {
        return { failed: true, message: 'Cannot save this alert. It ends before it starts.' };
      }

      if (checkEndsInPast(end)) {
        return { failed: true, message: 'Cannot save this alert. It ends in the past.' };
      }

      if (await checkForOverlap(start, end, station, key)) {
        return { failed: true, message: 'Cannot save this alert. Its start and end times overlap with another alert' };
      }
    } catch (error) {
      log('error', 'There was a problem validating the alert', { alert, error });
      return {
        failed: true,
        message: 'An unanticipated error occurred while trying to validate the alert. Please try again.'
      };
    }

    return { failed: false };
  },
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
  },
  /**
   * Add routes for alerts
   *
   * @param {object} app
   * @param {function} checkAuth
   */
  inject = (app, checkAuth) => {
    /**
     * Get the current alerts for a station
     */
    app.get('/alerts', async (req, res) => {
      const allowedParams = ['active', 'current', 'station'];

      try {
        const params = _pick(req.query, allowedParams),
          alerts = await getAlerts(params);

        res.status(200).send(alerts);
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error getting current alerts');
      }
    });

    /**
     * Add a new alert
     */
    app.post('/alerts', checkAuth, async (req, res) => {

      const alert = req.body,
        key = `${CLAY_SITE_HOST}/_alert/${uuidV4()}`,
        validation = await validate(key, alert);

      if (validation.failed) {
        return res.status(400).send(validation.message);
      }

      try {
        await db.post(key, { ...alert, active: true });

        res.status(200).send(key);
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error saving the alert');
      }
    });

    /**
     * Update an alert
     */
    app.put('/alerts', checkAuth, async (req, res) => {
      const { id: key, ...alert } = req.body,
        validation = await validate(key, alert);

      if (validation.failed) {
        return res.status(400).send(validation.message);
      }

      try {
        await db.put(key, alert);

        res.status(200).send({ key, ...alert });
      } catch (e) {
        log('error', e.message);
        res.status(500).send('There was an error saving the alert');
      }
    });
  };

module.exports.inject = inject;
module.exports.getAlerts = getAlerts;
