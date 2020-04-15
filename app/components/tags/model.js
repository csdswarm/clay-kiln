'use strict';
const _find = require('lodash/find'),
  { unityComponent } = require('../../services/universal/amphora'),
  { DEFAULT_STATION } = require('../../services/universal/constants'),
  { textToEncodedSlug } = require('../../services/universal/utils');

/**
 * get the rubric from the items
 * @param {array} items
 * @returns {string}
 */
function getRubric(items) {
  const rubric = _find(items, { isRubric: true });

  return rubric && rubric.text;
}

/**
 * make sure all tags are lowercase and have trimmed whitespace
 * also add encoded slug text for the tag for easier db retrieval
 * @param  {array} items
 * @return {array}
 */
function clean(items) {
  return (items || []).map(item => ({
    ...item,
    text: item.text.trim(),
    slug: textToEncodedSlug(item.text)
  }));
}

module.exports = unityComponent({
  save: function (uri, data) {
    data.items = clean(data.items); // first, make sure everything is lowercase and has trimmed whitespace
    data.featureRubric = getRubric(data.items); // also grab the feature rubric
    return data;
  },
  render: function (uri, data, locals) {
    console.log(JSON.stringify(locals.station, null, 2));
    data._computed.stationSlug = locals.station.id === DEFAULT_STATION.id
      ? ''
      : `/${locals.station.site_slug}`;
    return data;
  }
});

module.exports.clean = clean;
