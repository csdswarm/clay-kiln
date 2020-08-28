'use strict';


const { clientId } = require('../../services/universal/stats'),
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render: (uri, data) => {
    Object.assign(data._computed, { clientId });

    return data;
  }
});
