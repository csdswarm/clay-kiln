'use strict';

module.exports.render = (uri, data, locals) => {
  if (!locals.station) {
    return data;
  }
  data.station = locals.station;

  return data;
};
