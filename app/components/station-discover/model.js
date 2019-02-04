'use strict';

module.exports.render = (uri, data, locals) => {
  if (!locals.station) {
    return data;
  }
  data.station = locals.station;
  data.station.genre = data.station.genre_name.toString();

  return data;
};
