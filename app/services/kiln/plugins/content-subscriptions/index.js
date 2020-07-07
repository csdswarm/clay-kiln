'use strict';

// Require depedencies.
const { DEFAULT_STATION } = require('../../../universal/constants'),
  button = require('./button.vue'),
  content = require('./content.vue'),
  _set = require('lodash/set'),
  _get = require('lodash/get');

// Register plugin.
module.exports = () => {
  const currentStationId = _get(window, 'kiln.locals.stationForPermissions.id', DEFAULT_STATION.id);

  if ( currentStationId !== DEFAULT_STATION.id) {
    _set(window, 'kiln.navButtons.content-subscriptions', button);
    _set(window, 'kiln.navContent.content-subscriptions', content);
  }
};
