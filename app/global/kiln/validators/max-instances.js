'use strict';

const _reduce = require('lodash/reduce'),
  helpers = require('./helpers'),
  blocked = {
    // component name: maximum number allowed
    'single-related-story': 1,
    annotations: 1
  }; // add more components here

module.exports = {
  label: 'Max Instances',
  description: 'You cannot have more than one instance of these components',
  type: 'error',
  validate(state) {
    return _reduce(blocked, function (errors, max, name) {
      if (helpers.countComponents(state, name) > max) {
        errors.push({
          uri: helpers.getLastComponent(state, name),
          // no field, since we can't focus on component lists
          location: `${helpers.labelUtil(name)}`
        });
      }
      return errors;
    }, []);
  }
};
