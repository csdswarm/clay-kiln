'use strict';

/**
 * README
 *  - There's no way to easily override this button like you can the my-pages
 *    and all-pages buttons, which is why all this hacky javascript is
 *    necessary.  Also, the explanation for why we need our own sign-out logic
 *    is located in app/routes/add-endpoints/sign-out.js.
 */

const _set = require('lodash/set'),
  whenLeftNavMenuExists = require('./utils/when-left-nav-menu-exists');

function hasAncestor(ancestor, el) {
  while (el && el.parentElement !== ancestor) {
    el = el.parentElement;
  }

  return el && el.parentElement === ancestor;
}

module.exports = () => {
  _set(window, 'kiln.plugins.signOutOverride', rootStore => {
    whenLeftNavMenuExists(rootStore, leftNavMenu => {
      const signOutEl = Array.from(leftNavMenu.querySelectorAll('.nav-menu-button-text'))
          .find(el => el.innerText === 'SIGN OUT'),
        signOutBtn = signOutEl.parentElement;

      leftNavMenu.addEventListener(
        'click',
        evt => {
          if (
            signOutBtn === evt.target
            || hasAncestor(signOutBtn, evt.target)
          ) {
            window.location.href = '/rdc/sign-out';

            evt.preventDefault();
            evt.stopImmediatePropagation();
          }
        },
        { capture: true }
      );
    });
  });
};
