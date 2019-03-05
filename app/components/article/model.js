'use strict';

const createContent = require('../../services/universal/create-content'),
  /**
   * updates the key in the object if it exists replacing the ${key} with value
   *
   * @param {object} obj
   * @param {string} key
   * @param {string} value
   */
  defaultKeyValue = (obj, key, value) => {
    if (obj[key]) {
      console.log(key, value, obj[key], obj[key].replace(`\${${key}}`, value || ''), value || '')
      obj[key] = obj[key].replace(`\${${key}}`, value || '');
    }
  };

module.exports.render = function (ref, data, locals) {
  defaultKeyValue(data, 'stationTitle', locals.station.name);
  defaultKeyValue(data, 'stationLogoUrl', locals.station.square_logo_small);
  defaultKeyValue(data, 'stationURL', locals.station.website);

  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  return createContent.save(uri, data, locals);
};
