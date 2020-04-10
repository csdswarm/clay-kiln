'use strict';

const _get = require('lodash/get'),
  { stationizedComponent } = require('../../services/universal/stationize');

module.exports = stationizedComponent({
  render: async (ref, data) => {
    const
      buttons = {
        facebook: (url) => url,
        twitter: (id) => `https://twitter.com/${id}`,
        youtube: (url) => url,
        instagram: (url) => url
      };

    data._computed.socialButtons = [];

    Object.keys(buttons).forEach(type => {
      const url = _get(data, `_computed.station[${type}]`);

      if (url) {
        data._computed.socialButtons.push({ type, url: buttons[type](url) });
      }
    });

    return data;
  }
});
