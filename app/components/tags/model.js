'use strict';
var _find = require('lodash/find'),
  _map = require('lodash/map'),
  _assign = require('lodash/assign'),
  _set = require('lodash/set'),
  _includes = require('lodash/includes');

/**
 * get the rubric from the items
 * @param {array} items
 * @returns {string}
 */
function getRubric(items) {
  var rubric = _find(items, { isRubric: true });

  return rubric && rubric.text;
}

/**
 * make sure all tags are lowercase and have trimmed whitespace
 * @param  {array} items
 * @return {array}
 */
function clean(items) {
  return _map(items || [], function (item) {
    return _assign({}, item, { text: item.text.toLowerCase().trim(), display: item.text.trim() });
  });
}

module.exports.save = function (uri, data) {
  data.items = clean(data.items); // first, make sure everything is lowercase and has trimmed whitespace
  data.featureRubric = getRubric(data.items); // also grab the feature rubric
  return data;
};
module.exports.clean = clean;
