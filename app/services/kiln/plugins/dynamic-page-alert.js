'use strict';
const _ = require('lodash');

module.exports = () => {
  const { edit, isDynamicPage } = window.kiln.locals;

  _.set(window, ['kiln', 'plugins', 'dynamic-page-alert'], (store) => {
    if (edit && isDynamicPage) {
      store.dispatch('addAlert', { type: 'warning', text: `
        WARNING: You are currently editing a Dynamic Page. Any changes saved to this page will be 
        reflected on ALL pages that use this template - and across all stations on the Unity platform.  
        PLEASE NOTE: changes are applied immediately once saved and do not require the page to be republished.
      ` });
    };
  });
};
