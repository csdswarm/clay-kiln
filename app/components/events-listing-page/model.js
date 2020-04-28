'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { assignStationInfo } = require('../../services/universal/create-content.js');

module.exports = unityComponent({
  render: (uri, data) => {
    return data;
  },
  save: async (uri, data, locals) => {
    if (!locals || !locals.defaultStation) {
      return data;
    }

    assignStationInfo(uri, data, locals);

    return data;
  }
});
