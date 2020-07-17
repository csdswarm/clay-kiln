'use strict';

const
  _get = require('lodash/get'),
  createContent = require('../../services/universal/create-content'),
  { assignStationInfo } = require('../../services/universal/create-content'),
  { unityComponent } = require('../../services/universal/amphora'),

  _capitalize = (str) => {
    return str.split(' ').map(([first, ...rest]) => `${first.toUpperCase()}${rest.join('')}`).join(' ');
  };

module.exports = unityComponent({
  render: (ref, data, locals) => {
    if (_get(locals, 'params.host')) {
      data.host = _capitalize(locals.params.host.replace(/-/g, ' ').replace(/\//g,''));
    }
    assignStationInfo(ref, data, locals);

    return data;
  }
});

module.exports.save = (ref, data, locals) => createContent.save(ref, data, locals);
