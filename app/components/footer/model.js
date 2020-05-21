'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  _get = require('lodash/get');


module.exports = unityComponent({
  render: (uri, data, locals) => {
    // show RDC logo if within a station context
    data._computed.shouldShowNationalLogo = _get(locals, 'station.name', '') !== 'Radio.com';
    return data;
  }
});
