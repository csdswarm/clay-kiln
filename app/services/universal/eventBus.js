'use strict';

const callbacks = {};

/**
 * Define callback(s) for event
 * @param  {string} channel
 * @param  {Function} callback
 */
function addEventCallback(channel, callback) {
  callbacks[channel] = callbacks[channel] || [];
  callbacks[channel].push(callback);
}

/**
 * Trigger callback(s) on sub of message from event bus
 * @param  {string} channel
 * @param  {Object[]} payload
 */
function triggerCallback(channel, payload) {
  if (callbacks[channel] && callbacks[channel].length) {
    callbacks[channel].forEach(callback => {
      callback(payload);
    });
  }
}

module.exports.addEventCallback = addEventCallback;
module.exports.triggerCallback = triggerCallback;
