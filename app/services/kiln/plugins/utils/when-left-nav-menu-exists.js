'use strict';

const { hasClass } = require('../../../client/dom-helpers');

module.exports = (rootStore, cb) => {
  rootStore.subscribe(mutation => {
    if (mutation.type !== 'SHOW_NAV_BACKGROUND') {
      return;
    }

    const serverRenderedNavMenu = document.querySelector('.kiln-wrapper .nav-menu');

    if (serverRenderedNavMenu) {
      cb(serverRenderedNavMenu);
      return;
    }

    // this shouldn't be declared above the short circuit
    // eslint-disable-next-line one-var
    const kilnWrapper = document.querySelector('.kiln-wrapper'),
      runCallbackWhenRightDrawerExists = mutation => {
        const leftNavMenu = Array.from(mutation.addedNodes)
          .find(hasClass('nav-menu'));

        if (leftNavMenu) {
          cb(leftNavMenu);
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
  });
};
