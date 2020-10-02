'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  iconConfig = {
    faviconSizes: [16, 32, 96],
    appleTouchIconSizes: [0, 152, 167, 180],
    defaultIconPath: '/media/components/favicon/favicon.png'
  };

function buildIconLinkObject(size, linkTarget, path) {
  return {
    rel: linkTarget === 'favicon' ? 'icon' : 'apple-touch-icon-precomposed',
    sizes: size ? `${size}x${size}` : null,
    type: linkTarget === 'favicon' ? `image/${getFileTypeFromPath(path)}` : null,
    href: path
  };
}

function getFileTypeFromPath(path) {
  return path.slice(path.lastIndexOf('.') + 1);
}

module.exports = unityComponent({
  render: (uri, data, locals) => {

    if (!locals) {
      return;
    }

    data._computed.icons = [
      ...iconConfig.faviconSizes.map(size => buildIconLinkObject(size, 'favicon', iconConfig.defaultIconPath)),
      ...iconConfig.appleTouchIconSizes.map(size => buildIconLinkObject(size, 'appleTouchIcon', iconConfig.defaultIconPath))
    ];
    data._computed.stationId = locals.station.id;
    data._computed.stationOptions = locals.stationOptions;

    return data;
  }
});
