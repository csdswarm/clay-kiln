'use strict';

const { stationizedComponent } = require('../../services/universal/stationize');

module.exports = stationizedComponent({
  render: async (ref, data) => {
    const
      buttons = {
        facebook: (url) => url,
        twitter: (id) => `https://twitter.com/${id}`,
        youtube: (url) => url,
        instagram: (url) => url
      };

    data.socialButtons = [];

    Object.keys(buttons).forEach(type => {
      const url = data.station[type];

      if (url) {
        data.socialButtons.push({ type, url: buttons[type](url) });
      }
    });

    return data;
  }
});
