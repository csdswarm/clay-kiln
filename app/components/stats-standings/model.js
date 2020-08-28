'use strict';

const { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render: (uri, data) => {
    Object.assign(data._computed, { clientId: 'entercom' });

    return data;
  }
});
