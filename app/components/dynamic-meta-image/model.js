'use strict';

const _get = require('lodash/get'),
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render: (ref, data, locals) => {
    const routeVal = data.routeParam
        ? _get(locals, ['params', data.routeParam])
        : undefined,
      localsVal = data.localsPath
        ? _get(locals, data.localsPath)
        : undefined;

    if (routeVal || localsVal) {
      data._computed.imageUrl = data.dynamicImageUrl.replace(
        '${paramValue}',
        routeVal || localsVal
      );
    } else {
      data._computed.imageUrl = data.imageUrl;
    }

    return data;
  }
});
