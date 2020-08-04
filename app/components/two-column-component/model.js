'use strict';

const { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render: async (uri, data) => {
    return data;
  }
});
