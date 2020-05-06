'use strict';

const { hasClass } = require('../client/dom-helpers');

/**
 * Using the passed in kilnInput for subscribing and finding the station via the
 *   'schemaName', this method fires the callback when the publish drawer is
 *   opened and the '.right-drawer' element is rendered.
 *
 * This is useful when you want to make a small modification to the drawer.  If
 *   we need to make larger changes then we should override the drawer entirely.
 *
 * cb has the signature (rightDrawerElement) => undefined
 *
 * Note: this method takes the kilnInput as opposed to creating its own because
 *   either way I would need some way to free the memory when a component is no
 *   longer on the page.  If this service had one global subscription that ran
 *   an array of callbacks, then I'd also need to provide a way for the consumer
 *   to 'unsubscribe' which seemed more complex.
 *
 * @param {object} kilnInput
 * @param {function} cb
 */
module.exports = (kilnInput, cb) => {
  kilnInput.subscribe('OPEN_DRAWER', payload => {
    if (payload !== 'publish-page') {
      return;
    }

    const serverRenderedRightDrawer = document.querySelector('.kiln-wrapper .right-drawer');

    if (serverRenderedRightDrawer) {
      cb(serverRenderedRightDrawer);
      return;
    }

    // this shouldn't be declared above the short circuit
    // eslint-disable-next-line one-var
    const kilnWrapper = document.querySelector('.kiln-wrapper'),
      runCallbackWhenRightDrawerExists = mutation => {
        const rightDrawer = Array.from(mutation.addedNodes)
          .find(hasClass('right-drawer'));

        if (rightDrawer) {
          cb(rightDrawer);
          return true;
        }
      },
      observer = new MutationObserver(mutationList => {
        for (const mutation of mutationList) {
          const callbackRan = runCallbackWhenRightDrawerExists(mutation);

          if (callbackRan) {
            observer.disconnect();
            return;
          }
        }
      });

    observer.observe(kilnWrapper, { childList: true });
  }, false);
};
