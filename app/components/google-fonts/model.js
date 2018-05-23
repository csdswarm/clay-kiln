'use strict';

module.exports.save = function (ref, data) {
  const selection = data.fonts.split('?family=');

  return { fonts: selection.length > 1 ? selection[1] : selection[0] };
};
