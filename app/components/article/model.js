'use strict';

const createContent = require('../../services/universal/create-content'),
  /**
   * updates the key in the object if it exists replacing the ${key} with value
   *
   * @param {object} obj
   * @param {string} key
   * @param {string} value
   */
  replaceDefaultKeyValue = (obj, key, value) => {
    if (obj[key]) {
      obj[key] = obj[key].replace(`\${${key}}`, value || '');
    }
  },
  {autoLink} = require('../breadcrumbs');

module.exports.render = function (ref, data, locals) {
  data.crumbs = autoLink(data, ['sectionFront', 'secondaryArticleType'], locals.site.host);
  // set to published date if before the publish date.
  if (!data.dateModified || data.dateModified < data.date) {
    data.dateModified = data.date;
  }
  const isStation = locals.station.slug !== 'www';

  replaceDefaultKeyValue(data, 'stationLogoUrl', isStation ? locals.station.square_logo_small : '');
  replaceDefaultKeyValue(data, 'stationURL', isStation ? locals.station.website : '');

  if (data.byline && data.byline[0].sources.length) {
    replaceDefaultKeyValue(data.byline[0].sources[0], 'text', isStation ? locals.station.name : '');
    if (data.byline[0].sources[0].text === '') {
      data.byline[0].sources.length = 0;
    }
  }

  return createContent.render(ref, data, locals);
};

module.exports.save = function (uri, data, locals) {
  data.dateModified = (new Date()).toISOString();
  return createContent.save(uri, data, locals);
};
