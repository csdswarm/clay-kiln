'use strict';

const preloadTimeout = 5000;

/**
  * A helper method which subscribes to PRELOAD_SUCCESS and returns a promise
  *   of the first result.
  *
  * @param {object} subscriptions
  * @param {boolean} scoped
  * @returns {Promise}
  */
function whenPreloaded(subscriptions, scoped = false) {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        reject(new Error(`PRELOAD_SUCCESS wasn't published after ${preloadTimeout} ms`));
      }, preloadTimeout);

      subscriptions.subscribe(
        'PRELOAD_SUCCESS',
        (...args) => {
          // this unsubscribes from the event as future event calls serve
          //   no purpose.
          delete subscriptions.subscribedEvents.PRELOAD_SUCCESS;
          resolve(...args);
        },
        scoped
      );
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { whenPreloaded };
