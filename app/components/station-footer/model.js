'use strict';

const { getStationPage, getStationFooter } = require('../../services/server/stationThemingApi');

module.exports.render = async (ref, data, locals) => {
  const { station, defaultStation } = locals,
    { slug } = station,
    isNotDefaultStation = slug !== defaultStation.slug,
    buttons = {
      facebook: (url) => url,
      twitter: (id) => `https://twitter.com/${id}`,
      youtube: (url) => url,
      instagram: (url) => url
    };

  let instanceData = Object.assign({}, data, { _computed: {
    renderForStation: isNotDefaultStation
  } });

  instanceData.station = station;

  if (ref.endsWith('default') && isNotDefaultStation) {
    const stationPageData = getStationPage(slug);

    if (stationPageData) {
      instanceData = Object.assign(instanceData, await getStationFooter(stationPageData));
    } else {
      instanceData._computed.renderForStation = false;
    }
  }

  instanceData.socialButtons = [];

  Object.keys(buttons).forEach(type => {
    const url = instanceData.station[type];

    if (url) {
      instanceData.socialButtons.push({ type, url: buttons[type](url) });
    }
  });

  return instanceData;
};
