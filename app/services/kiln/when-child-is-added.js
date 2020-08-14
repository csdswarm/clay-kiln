'use strict';

const { hasClass } = require('../client/dom-helpers');

/**
 * This method fires the callback once when the child class either pre-exists
 *   from the server or is added.  It is assumed the parent class exists at the
 *   time this function is called.
 *
 * Note: if an observer is created, currently this only fires once then
 *   disconnects.  This is for performance reasons since we should only be
 *   listening to the dom when needed.  Right now this is being called after
 *   certain kiln events which happen right before the dom mutations we
 *   care about.
 *
 * @param {function} cb
 * @param {string} childClass
 * @param {string} parentClass
 */
module.exports = ({ cb, childClass, parentClass }) => {
  const serverRenderedChild = document.querySelector(
    `.${parentClass} .${childClass}`
  );

  if (serverRenderedChild) {
    cb(serverRenderedChild);
    return;
  }

  // this shouldn't be declared above the short circuit
  // eslint-disable-next-line one-var
  const parentEl = document.querySelector(`.${parentClass}`),
    runCallbackWhenChildExists = mutation => {
      const childEl = Array.from(mutation.addedNodes)
        .find(hasClass(childClass));

      if (childEl) {
        cb(childEl);
        return true;
      }
    },
    observer = new MutationObserver(mutationList => {
      for (const mutation of mutationList) {
        const callbackRan = runCallbackWhenChildExists(mutation);

        if (callbackRan) {
          observer.disconnect();
          return;
        }
      }
    });

  observer.observe(parentEl, { childList: true });
};
