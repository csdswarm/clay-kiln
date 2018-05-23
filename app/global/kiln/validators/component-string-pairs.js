'use strict';

const _reduce = require('lodash/reduce'),
  _get = require('lodash/get'),
  _isString = require('lodash/isString'),
  helpers = require('./helpers'),
  pairs = [{
    matchComponent: 'annotation',
    matchString: {
      component: 'clay-paragraph',
      field: 'text',
      string: 'span class="clay-annotated kiln-phrase"'
    },
    errorMessage: 'Article annotations do not match annotations components.'
  }]; // add more component/string pairs you want to validate into here

/**
 * count the number of components that have a field with a certain string
 * @param  {object} state
 * @param  {object} matchString
 * @return {number}
 */
function countStrings(state, matchString) {
  return _reduce(state.components, (matches, component, uri) => {
    if (helpers.isSameComponent(uri, matchString.component, component)) {
      const fieldValue = _get(component, matchString.field);

      if (_isString(fieldValue)) {
        // find all matches in a component
        matches = matches + fieldValue.split(matchString.string).length - 1;
      }
    }
    return matches;
  }, 0);
}

module.exports = {
  label: 'Matching Components',
  description: 'The number of certain components must match the number of text references',
  type: 'error',
  validate(state) {
    return _reduce(pairs, function (errors, pair) {
      const numberOfStrings = countStrings(state, pair.matchString),
        numberOfComponents = helpers.countComponents(state, pair.matchComponent),
        diff = numberOfStrings - numberOfComponents;

      if (diff > 0) {
        // too many strings
        errors.push({
          uri: helpers.getLastComponent(state, pair.matchString.component),
          field: pair.matchString.field,
          location: `${helpers.labelUtil(pair.matchString.component)}`,
          preview: `${pair.errorMessage} (${numberOfStrings} vs ${numberOfComponents})`
        });
      } else if (diff < 0) {
        // too many components
        errors.push({
          uri: helpers.getLastComponent(state, pair.matchComponent),
          // no field, since we can't focus on component lists
          location: `${helpers.labelUtil(pair.matchComponent)}`,
          preview: `${pair.errorMessage} (${numberOfStrings} vs ${numberOfComponents})`
        });
      }
      return errors;
    }, []);
  }
};
