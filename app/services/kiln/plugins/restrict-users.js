'use strict';

const _set = require('lodash/set'),
  whenLeftNavMenuExists = require('./utils/when-left-nav-menu-exists'),
  { unityAppDomainName: unityApp } = require('../../universal/urps');

module.exports = () => {
  const { user } = window.kiln.locals;

  if (user.can('access').the('unity-users').for(unityApp).value) {
    return;
  }

  _set(window, 'kiln.plugins.restrictUsers', rootStore => {
    whenLeftNavMenuExists(rootStore, leftNavMenu => {
      const usersEl = Array.from(leftNavMenu.querySelectorAll('.nav-menu-button-text'))
        .find(el => el.innerText === 'USERS');

      // non-clay admins don't have access to the users button.  So although all
      //   users should probably be clay admins for sake of making things
      //   simpler, this if statement is easy'nuff
      if (usersEl) {
        const signOutBtn = usersEl.parentElement;

        signOutBtn.remove();
      }
    });
  });
};
