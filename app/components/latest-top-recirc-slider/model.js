'use strict';

const { recirculationData } = require('../../services/universal/recirc/recirculation'),
  { DEFAULT_STATION } = require('../../services/universal/constants');

module.exports = recirculationData({
  mapDataToFilters: (uri, data, locals) => {
    const {
      id: stationId,
      site_slug: stationSlug
    } = locals.station;

    if (stationId !== DEFAULT_STATION.id) {
      return Object.assign({}, data, {
        filters: { stationSlug }
      });
    }

    return data;
  }
});
