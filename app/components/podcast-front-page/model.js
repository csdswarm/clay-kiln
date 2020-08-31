'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  stationThemingApi = require('../../services/server/stationThemingApi'),
  { COLORS, DEFAULT_STATION } = require('../../services/universal/constants'),
  { defaultTheme } = require('../theme/model'),
  { assignStationInfo } = require('../../services/universal/create-content/index');

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
      console.error(err);

      return defaultTheme.primaryColor;
    }
  }

  return sectionFrontToPrimaryColor[sectionFront.toLowerCase()]
    || defaultTheme.primaryColor;
}

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    data._computed.primaryColor = await getPrimaryColor(locals);
    return data;
  },
  /**
   * Makes any necessary modifications to data just prior to persisting it
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  save: (uri, data, locals) => {
    assignStationInfo(uri, data, locals);
    return data;
  }
});
