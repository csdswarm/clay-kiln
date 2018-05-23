'use strict';

const _reduce = require('lodash/reduce'),
  helpers = require('./helpers'),
  pairs = [{
    firstComponent: 'interactive-homelessness-tab',
    secondComponent: 'interactive-homelessness-panel',
    errorMessage: 'The number of tabs does not match the number of tab panels.'
  }]; // add more component pairs you want to validate into here

module.exports = {
  label: 'Component Pairs',
  description: 'The number of components in certain pairs must match',
  type: 'error',
  validate(state) {
    return _reduce(pairs, function (errors, pair) {
      const diff = helpers.countComponents(state, pair.firstComponent) - helpers.countComponents(state, pair.secondComponent);

      if (diff > 0) {
        // too many of the first component
        errors.push({
          uri: helpers.getLastComponent(state, pair.firstComponent),
          // no field, since we can't focus on component lists
          location: `${helpers.labelUtil(pair.firstComponent)}`,
          preview: pair.errorMessage
        });
      } else if (diff < 0) {
        // too many of the second component
        errors.push({
          uri: helpers.getLastComponent(state, pair.secondComponent),
          // no field, since we can't focus on component lists
          location: `${helpers.labelUtil(pair.secondComponent)}`,
          preview: pair.errorMessage
        });
      }
      return errors;
    }, []);
  }
};
