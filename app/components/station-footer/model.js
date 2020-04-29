'use strict';

const { getStationPage, getStationFooter } = require('../../services/server/stationThemingApi'),
  addSocialButtons = require('../../services/universal/add-social-buttons'),
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render: async (ref, data, locals) => {
    const { station, defaultStation } = locals,
      { site_slug } = station,
      isDefaultStation = site_slug === defaultStation.site_slug,
      isDefaultRef = /instances\/default/.test(ref);

    data._computed = {
      renderForStation: !isDefaultStation || !isDefaultRef
    };

    data.station = station;

    if (isDefaultRef && !isDefaultStation) {
      const stationPageData = await getStationPage(site_slug);

      if (stationPageData) {
        Object.assign(data, await getStationFooter(stationPageData));
      } else {
        // If there's no published station page, don't render the default footer
        data._computed.renderForStation = false;
      }
    }

    addSocialButtons(data);

    return data;
  }
});
