'use strict';

const TYPEKIT_KIT_ID_REGEX = /\/(\w+).js/;

module.exports.render = function (uri, data) {
  const {kitSrc} = data,
    [, kitId] = TYPEKIT_KIT_ID_REGEX.exec(kitSrc || '') || [null, null];

  if (kitId) {
    data.kitId = kitId;
  }

  return data;
};
