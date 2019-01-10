'use strict';

const _startCase = require('lodash/startCase'),
  _find = require('lodash/find'),
  _filter = require('lodash/filter'),
  _findLastKey = require('lodash/findLastKey'),
  _isEmpty = require('lodash/isEmpty'),
  { getComponentName } = require('clayutils');

function dropClay(name) {
  return name.replace(/^clay\-/i, '');
}

/**
 * determine if a component is a the specified one
 * note: check to see if the component has been deleted, by checking its data
 * @param  {string}  uri
 * @param  {string}  name
 * @param {object} data
 * @return {Boolean}
 */
function isSameComponent(uri, name, data) {
  return module.exports.getComponentName(uri) === name && !_isEmpty(data);
}

/**
 * count number of matching components in the state
 * @param  {object} state
 * @param  {string} name
 * @return {number}
 */
function countComponents(state, name) {
  return _filter(state.components, (component, uri) => isSameComponent(uri, name, component)).length;
}

/**
 * get uri of the last matching component
 * @param  {object} state
 * @param  {string} name
 * @return {string}
 */
function getLastComponent(state, name) {
  return _findLastKey(state.components, (component, uri) => isSameComponent(uri, name, component));
}

/**
 * getLastComponentData
 *
 * @param {Object} state
 * @param {String} name
 * @returns {Object} data from component found in getLastComponent
 */
function getLastComponentData(state, name) {
  return state.components[getLastComponent(state, name)];
}

module.exports = {
  // from kiln/utils/references
  getComponentName,
  // from kiln/utils/references
  refProp: '_ref',
  labelProp: '_label',
  // from kiln/utils/label
  labelUtil(name, schema) {
    var label = schema && schema[module.exports.labelProp];

    if (label) {
      return label;
    } else {
      return dropClay(name).split('-').map(_startCase).join(' '); // split on hyphens
    }
  },
  // from kiln/validators/helpers
  getPreviewText(text, index, length) {
    const cutStart = 20,
      cutEnd = 20; // don't add ellipses if we're this close to the start or end

    let previewText = text,
      endIndex = index;

    if (index > cutStart) {
      previewText = `…${text.substr(index - cutStart)}`;
      endIndex = index - (index - cutStart) + 1;
    }

    if (previewText.length > endIndex + cutEnd) {
      previewText = `${previewText.substr(0, endIndex + cutEnd + length)}…`;
    }

    return previewText;
  },
  findArticle(components) {
    return _find(components, (data, uri) => getComponentName(uri) === 'article');
  },
  isSameComponent: isSameComponent,
  countComponents: countComponents,
  getLastComponent: getLastComponent,
  getLastComponentData: getLastComponentData
};
