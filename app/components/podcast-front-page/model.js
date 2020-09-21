'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { assignStationInfo } = require('../../services/universal/create-content/index'),
  { COLORS, DEFAULT_STATION } = require('../../services/universal/constants');

/**
 * since there is now a default theme set on all national pages (ON-2041)
 * we will need to override the primary color when on the national podcast front
 * to get the robinsEgg to be the primaryColor
 *
 * @param {Object} locals
 * @returns {string}
 */
function shouldOverrideThemeColors(locals) {
  const { station = {} } = locals;

  if (station.id === DEFAULT_STATION.id) {
    return {
      primaryColorOverride: COLORS.robinsEggBlue,
      secondaryColorOverride: COLORS.black
    };
  } else {
    return undefined;
  }
}

module.exports = unityComponent({
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
  },
  render: (uri, data, locals) => {
    if (!locals) {
      return;
    }
    data._computed.themeColorsOverride = shouldOverrideThemeColors(locals);
    return data;
  }
});
