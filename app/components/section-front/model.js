'use strict';

const log = require('../../services/universal/log').setup({ file: __filename }),
  stationThemingApi = require('../../services/server/stationThemingApi'),
  { assignStationInfo } = require('../../services/universal/create-content'),
  { COLORS, DEFAULT_STATION } = require('../../services/universal/constants'),
  { defaultTheme } = require('../theme/model'),
  { unityComponent } = require('../../services/universal/amphora');

const sectionFrontToPrimaryColor = {
  audio: COLORS.robinsEggBlue,
  music: COLORS.sunsetOrange,
  news: COLORS.lightningYellow,
  sports: COLORS.azureRadience
};

/**
 * returns the primary color based first off station then section front
 *
 * @param {object} locals
 * @returns {string}
 */
async function getPrimaryColor(locals) {
  const { sectionFront = '', station = {} } = locals;

  if (station.id !== DEFAULT_STATION.id) {
    try {
      const { primaryColor } = await stationThemingApi.get(station.site_slug, defaultTheme);

      return primaryColor;
    } catch (err) {
      log('error', err);

      return defaultTheme.primaryColor;
    }
  }

  return sectionFrontToPrimaryColor[sectionFront.toLowerCase()]
    || defaultTheme.primaryColor;
}

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    if (data.title) {
      if (data.primary) {
        locals.sectionFront = data.title.toLowerCase();
      } else {
        locals.sectionFront = data.primarySectionFront;
        locals.secondarySectionFront = data.title.toLowerCase();
      }
    }

    data._computed.primaryColor = await getPrimaryColor(locals);

    return data;
  },
  save: (uri, data, locals) => {
    assignStationInfo(uri, data, locals);

    return {
      ...data,
      revealSectionFrontControls: !data.stationFront && !data.titleLocked
    };
  }
});
