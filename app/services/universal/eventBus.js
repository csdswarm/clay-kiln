'use strict';

const callbacks = {};

/**
 * Define callback for event
 * @param  {string} channel
 * @param  {Function} callback
 */
function setEventCallback(channel, callback) {
  callbacks[channel] = callback;
}

/**
 * Trigger callback on sub of message from event bus
 * @param  {string} channel
 * @param  {Object[]} payload
 */
function triggerCallback(channel, payload) {
  if (callbacks[channel]) {
    (callbacks[channel])(payload);
  }
}

module.exports.setEventCallback = setEventCallback;
module.exports.triggerCallback = triggerCallback;
