'use strict';

const _pick = require('lodash/pick'),
  db = require('../../services/server/db'),
  log = require('../../services/universal/log').setup({ file: __filename }),
  uuidV4 = require('uuid/v4'),
  { getAlerts } = require('../../services/server/alerts'),
  { prettyJSON } = require('../../services/universal/utils');

const CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  checkEndsBeforeStart = (start, end) => new Date(end) < new Date(start),
  checkEndsInPast = end => new Date(end) < Date.now(),
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
      log(
        'error',
        'There was a problem validating the alert'
        + `\nalert: ${prettyJSON(alert)}`
        + `\n${error.stack}`
      );

      return {
        failed: true,
        message: 'An unanticipated error occurred while trying to validate the alert. Please try again.'
      };
    }

    return { failed: false };
  };

/**
 * Add routes for alerts
 *
 * @param {object} router
 */
module.exports = router => {
  /**
   * Get the current alerts for a station
   */
  router.get('/alerts', async (req, res) => {
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
  router.post('/alerts', async (req, res) => {

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
  router.put('/alerts', async (req, res) => {
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
