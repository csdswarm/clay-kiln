'use strict';

const
  _noop = require('lodash/noop'),
  { datadogLogs } = require('@datadog/browser-logs'),
  fn = { init };

function init() {
  datadogLogs.init({
    clientToken: process.env.DATADOG_CLIENT_TOKEN,
    env: process.env.NODE_ENV,
    forwardErrorsToLogs: false,
    sampleRate: 100,
    site: 'datadoghq.com',
    service: process.env.CLAY_SITE_HOST,
    useSecureSessionCookie: true
  });
  datadogLogs.logger.setLevel(process.env.LOG);
  datadogLogs.logger.setHandler('http');
  fn.init = _noop; // only run init once, then do nothing.
}

module.exports = {
  datadogLog(message, data, level) {
    fn.init();
    datadogLogs.logger.log(message, data, level);
  }
};
