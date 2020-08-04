'use strict';
const _get = require('lodash/get');

/**
 * Assigns the field to the data found in defaultFieldName if the value should
 *   not be overridden.
 *
 * Note: ideally this would be done inside unityComponent -> save by parsing the
 *   schema and handling the default assignment for all
 *   default-text-with-override inputs.  However that would require a yaml
 *   transform in claycli (or *gasp*, use json instead of yaml), so handling it
 *   manually this way is the next best solution.
 *
 * @param {string} fieldName - the field declared in schema.yaml which _has input: default-text-with-override
 * @param {string} defaultFieldName - the defaultField for the input, also declared in schema.yaml
 * @param {object} data - the component data
 */
const handleDefault = (fieldName, defaultFieldName, data) => {
  // this data is created via UPDATE_COMPONENT in ./input.vue
  const internalState = data[`_${fieldName}`] || {};

  if (_get(data,defaultFieldName) && !internalState.shouldOverride) {
    data[fieldName] = data[defaultFieldName];
  }
};

module.exports = { handleDefault };
