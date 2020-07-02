'use strict';
const podcastUtils = require('../../services/universal/podcast'),
  radioApiService = require('../../services/server/radioApi'),
  stationUtils = require('../../services/server/station-utils');

module.exports['1.0'] = function (uri, data) {

  data.title = 'Podcasts';
  data.primaryColor = '';
  data.showTitle = true;
  data.showCallToActions = true;
  data.isTitleFontColorDark = false;

  return data;
};

module.exports['2.0'] = function (uri, data) {

  data.backFillEnabled = true;

  return data;
};


module.exports['3.0'] = async (uri, data, locals) => {
  const { items } = data,
    allStationData = await stationUtils.getAllStations.byId({ locals });

  await Promise.all(items.map(async (item) => {
    const { title } = item.podcast,
      params = {
        q: title
      },
      { data: [podcast] } = await radioApiService.get('podcasts', params, null, {}, locals);

    item.podcast.url = podcastUtils.createUrl(podcast, allStationData);
  }));
  return data;
};
