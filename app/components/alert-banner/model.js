'use strict';

const { getAlerts } = require('../../services/server/alerts'),
  log = require('../../services/universal/log').setup({ file: __filename });

/**
 * Gets the first part of the guid after _alert/ in the id
 *
 * Why? ids look like `clay.radio.com/_alert/92c8f99d-1dfe-4eb0-be3b-65510333b08d`.
 *
 * Since we are saving these as cookies and they will only last 24 hours, shorten them
 * so they take less space and are easier to parse. Result for example id is `92c8f99d`.
 *
 * NOTE: assumes that the 8 chars before the first dash will be significantly different
 * from each other during a 24 hour period. If this is an issue, we could potentially use
 * a hash of station and start.
 *
 * @param {string} id
 * @returns {string}
 */
function hashId(id) {
  return id.replace(/^.*\_alert\//, '').split('-')[0];
}

/**
 * Handles error logging for alerts
 * @param {object} error
 */
function handleErrors(error) {
  if (error && error.response && error.response.status === 404) {
    log('error', 'Could not get alert banners. Endpoint not found.');
  } else {
    log('error', 'There was a problem attempting to get alert banners', error);
  }
}

/**
 * Gets banner alerts and organizes the results as needed.
 *
 * @param {object} locals
 * @param {object} locals.site
 * @param {string} locals.site.protocol
 * @param {string} locals.site.host
 * @param {object} locals.station
 * @param {string} locals.station.callsign
 * @param {string[]} locals.closedAlerts
 * @param {object} locals.defaultStation
 * @returns {Promise<{id: string, message: string, breaking: boolean}[]>}
 */
async function prepareAlerts(locals) {
  try {
    const
      { callsign } = locals.station || {},
      { closedAlerts = [] } = locals,
      existingMessages = message => message && message.length,
      unclosedMessages = message => !closedAlerts.includes(message.id),
      alertParams = (station) => ({
        active: true,
        current: true,
        station
      }),
      globalAlerts = getAlerts(
        alertParams('GLOBAL'),
        locals,
        {
          amphoraTimingLabelPrefix: 'get global alerts',
          shouldAddAmphoraTimings: true
        },
      ),
      stationAlerts = callsign
        ? getAlerts(alertParams(callsign),
          locals,
          {
            amphoraTimingLabelPrefix: `get alerts for ${callsign}`,
            shouldAddAmphoraTimings: true
          })
        : [],
      messages = await Promise.all([globalAlerts, stationAlerts]);

    return messages
      .filter(existingMessages)
      .map(([{ id, message, breaking, link }]) => ({
        id: hashId(id),
        message,
        breaking,
        link
      }))
      .filter(unclosedMessages);
  } catch (error) {
    handleErrors(error);
  }
}

/**
 * Page model render
 *
 * @param {string} ref url
 * @param {object} data persistence data for the control
 * @param {object} locals data
 * @returns {object} - data
 */
module.exports.render = (ref, data, locals) => {
  return prepareAlerts(locals)
    .then(messages => locals.messages = messages)
    .then(() => data)
    .catch(handleErrors);
};

