'use strict';

// Require depedencies.
const { DEFAULT_STATION } = require('../../../universal/constants'),
  nationalSubscriptionsButton = require('./national-subscriptions-button.vue'),
  nationalSubscriptions = require('./national-subscriptions.vue'),
  _set = require('lodash/set'),
  _get = require('lodash/get');

// Register plugin.
module.exports = () => {
  const currentStationId = _get(window, 'kiln.locals.stationForPermissions.id', DEFAULT_STATION.id);

  if ( currentStationId !== DEFAULT_STATION.id) {
    _set(window, 'kiln.navButtons.national-subscriptions', nationalSubscriptionsButton);
    _set(window, 'kiln.navContent.national-subscriptions', nationalSubscriptions);
  }
};
