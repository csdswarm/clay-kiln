'use strict';

const { getComponentName } = require('clayutils'),
  { unityComponent } = require('./amphora'),
  { getStationPage, getStationSpecificComponent } = require('../server/stationThemingApi');

// Use this wrapper for components that should be updated to a station-specific instance if
// a station exists on locals.  This will set the station in data, and update the data with
// the station specific version of that component if a station page exists.
module.exports.stationizedComponent = ({ render, save }) => unityComponent({
  async render(ref, data, locals) {
    const { station, defaultStation } = locals,
      { site_slug } = station,
      isDefaultStation = site_slug === defaultStation.site_slug,
      isDefaultRef = /instances\/default/.test(ref);

    data._computed = {
      renderForStation: !isDefaultStation || !isDefaultRef
    };

    data.station = station;
    
    if (isDefaultRef && !isDefaultStation && site_slug) {
      const stationPageData = await getStationPage(site_slug),
        componentName = getComponentName(ref);
  
      if (stationPageData) {
        Object.assign(data, await getStationSpecificComponent(stationPageData, componentName));
      } else {
        // If there's no published station page, don't render the default component
        data._computed.renderForStation = false;
      }
    }

    return render(ref, data, locals);
  },
  save
});
