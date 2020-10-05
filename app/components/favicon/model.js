'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  _get = require('lodash/get'),
  iconConfig = {
    faviconSizes: [16, 32, 96],
    appleTouchIconSizes: [0, 152, 167, 180],
    defaultIconPath: '/media/components/favicon/favicon.png'
  };

/**
 * returns formatted data for the view to consume to build the icon head links
 *
 * @param {string} size
 * @param {string} linkTarget
 * @param {object} locals
 * @returns {object}
 */
function buildIconLinkObject(size, linkTarget, locals) {
  const faviconPath = _get(locals,'stationOptions.favicon'),
    path = faviconPath || iconConfig.defaultIconPath;

  return {
    rel: linkTarget === 'favicon' ? 'icon' : 'apple-touch-icon-precomposed',
    sizes: size ? `${size}x${size}` : null,
    type: linkTarget === 'favicon' ? `image/${getFileTypeFromPath(path)}` : null,
    href: path
  };
}

/**
 * returns the extension of a file path
 *
 * @param {string} path
 * @returns {string}
 */
function getFileTypeFromPath(path) {
  return path.slice(path.lastIndexOf('.') + 1);
}

module.exports = unityComponent({
  render: (uri, data, locals) => {

    if (!locals) {
      return;
    }

    data._computed.icons = [
      ...iconConfig.faviconSizes.map(size => buildIconLinkObject(
        size, 'favicon', locals)
      ),
      ...iconConfig.appleTouchIconSizes.map(size => buildIconLinkObject(
        size, 'appleTouchIcon', locals)
      )
    ];
    data._computed.stationId = locals.station.id;
    data._computed.stationOptions = locals.stationOptions;

    return data;
  }
});
