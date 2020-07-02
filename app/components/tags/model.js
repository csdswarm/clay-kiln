'use strict';

const _find = require('lodash/find'),
  _map = require('lodash/map'),
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

module.exports.save = function (uri, data) {
  data.items = clean(data.items); // first, make sure everything is lowercase and has trimmed whitespace
  data.featureRubric = getRubric(data.items); // also grab the feature rubric
  data.textTags = _map(data.items, 'text');
  return data;
};
module.exports.clean = clean;
