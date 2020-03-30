'use strict';

// Require depedencies.
const nationalSubscriptionsButton = require('./national-subscriptions-button.vue'),
  nationalSubscriptions = require('./national-subscriptions.vue');

// Register plugin.
module.exports = () => {
  window.kiln = window.kiln || {};
  window.kiln.navButtons = window.kiln.navButtons || {};
  window.kiln.navContent = window.kiln.navContent || {};
  if (window.kiln.locals.station.id !== 0) {
    window.kiln.navButtons['national-subscriptions'] = nationalSubscriptionsButton;
    window.kiln.navContent['national-subscriptions'] = nationalSubscriptions;
  }
};
