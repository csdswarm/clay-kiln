'use strict';

const log = require('../../services/universal/log').setup({ file: __filename }),
  { get } = require('../../services/server/stationThemingApi'),
  defaultTheme = {
    primaryColor: '#1F055E',
    secondaryColor: '#3C00B7',
    tertiaryColor: '#393939',
    primaryFontColor: '#FFFFFF',
    secondaryFontColor: '#000000'
  },

  /**
   * returns a copy of themes with keys appended 'RGB' and the value of the key as an RGB string
   *
   * @param {object} themes
   *
   * @return {object}
   */
  themeRGBColors = (themes) => {
    const obj = {},
      /**
       * converts a hex value to a RGB string
       *
       * @param {string} hex
       *
       * @return {string}
       */
      hextToRgb = (hex) => hex.replace(
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
        (match, first, second, third) => `${parseInt(first, 16)}, ${parseInt(second, 16)}, ${parseInt(third, 16)}`);

    Object.keys(themes).forEach(key => obj[`${key}RGB`] = hextToRgb(themes[key]));

    return obj;
  };

module.exports.render = async (ref, data, locals) => {
  // as log as there is an station id, get the theme
  if (locals.station.id) {
    let theme = {};

    try {
      theme = await get(locals.station.site_slug, defaultTheme);
    } catch (err) {
      log('error', err);

      theme = defaultTheme;
    }

    data.theme = {
      ...theme,
      ...themeRGBColors(theme)
    };
  }

  return data;
};

Object.assign(module.exports, { defaultTheme });
