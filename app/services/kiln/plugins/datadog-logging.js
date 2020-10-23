'use strict';

const { datadogLog } = require('../../client/datadog-logs');

module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.plugins = window.kiln.plugins || {};
  window.kiln.plugins['datadog-logging'] = store => {
    store.subscribeAction(({ type, payload }) => {
      if (type === 'notify') {
        console.debug({ payload });
        datadogLog('UNITY CLIENT : KILN NOTIFICATION', { data: { ...payload } }, payload.level);
      }
    });
  };
};
