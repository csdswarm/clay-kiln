'use strict';

const whenChildIsAdded = require('../../when-child-is-added');

/**
 * Fires the callback whenever the left nav menu exists
 *
 * @param {object} rootStore
 * @param {function} cb
 */
module.exports = (rootStore, cb) => {
  rootStore.subscribe(mutation => {
    if (mutation.type !== 'SHOW_NAV_BACKGROUND') {
      return;
    }

    whenChildIsAdded({
      cb,
      childClass: 'nav-menu',
      parentClass: 'kiln-wrapper'
    });
  });
};
