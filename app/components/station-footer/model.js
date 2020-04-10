'use strict';

const addSocialButtons = require('../../services/universal/add-social-buttons'),
  { stationizedComponent } = require('../../services/universal/stationize');

module.exports = stationizedComponent({
  render: async (ref, data) => {
    addSocialButtons(data);

    return data;
  }
});
