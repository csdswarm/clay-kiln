'use strict';

/*
 * This validation rule is for components that require at least one field value for publication.
 * For example, an annotation requires `text` OR `imageUrl`
 */

/**
 * @param {string} componentName
 * @returns {string}
 */
const _reduce = require('lodash/reduce'),
  _find = require('lodash/find'),
  _get = require('lodash/get'),
  _isString = require('lodash/isString'),
  helpers = require('./helpers'),
  isFieldEmpty = require('../../../services/universal/utils').isFieldEmpty,
  // note: all operators are here if you want to use them in rules, below
  operators = {
    '===': (l, r) => l === r,
    '!==': (l, r) => l !== r,
    '<': (l, r) => l < r,
    '>': (l, r) => l > r,
    '<=': (l, r) => l <= r,
    '>=': (l, r) => l >= r,
    typeof: (l, r) => typeof l == r
  },
  blocked = {
    // blocked if both text and imageUrl are empty
    annotation: ['text', 'imageUrl'],
    'interactive-homelessness-tab': ['title', 'imageUrl'],
    'agree-disagree-quiz-question': ['question', 'mediaQuestion'],
    'scale-quiz-question': ['question', 'mediaQuestion'],
    // 'multiple-choice-quiz-question': ['question', 'mediaQuestion'],
    'fill-in-the-blank-quiz-questions': ['question', 'mediaElements']
  }; // add more components and their conditionally-required fields here

/**
 * determine if a field is invalid, by comparing it to some value
 * @param  {*}  value
 * @param  {string}  operator
 * @param  {*}  compare
 * @return {Boolean}
 */
function isFieldInvalid(value, { operator, compare }) {
  return operators[operator](value, compare);
}

/**
 * get field name
 * @param  {string|object} field
 * @return {string}
 */
function getFieldName(field) {
  return _isString(field) ? field : field.field;
}

/**
 * determine if a field is empty or invalid
 * @param  {object}  component from state
 * @param  {string|object}  field     matching rule
 * @return {Boolean}
 */
function isEmptyOrInvalid(component, field) {
  const name = getFieldName(field),
    value = component[name];

  if (_isString(field)) {
    // see if the value is empty
    return isFieldEmpty(value);
  } else {
    return isFieldInvalid(value, field);
  }
}

/**
 * validate a component against field rules
 * @param  {array} errors
 * @param  {string} uri
 * @param  {object} component
 * @param  {array} fields
 * @param {object} schemas
 */
function validateComponent(errors, { uri, component, fields, schemas}) {
  const invalidFields = [];

  fields.forEach(function (field) {
    if (isEmptyOrInvalid(component, field)) {
      const fieldName = getFieldName(field);

      invalidFields.push(fieldName); // add this BEFORE checking

      if (invalidFields.length === fields.length) {
        // all fields are empty/invalid!
        const componentName = helpers.getComponentName(uri);

        errors.push({
          uri,
          location: `${helpers.labelUtil(componentName)} » ${invalidFields.map((name) => helpers.labelUtil(name, _get(schemas, `${componentName}.${name}`))).join(' or ')}`
        });
      }
    }
  });
}

module.exports = {
  label: 'One Required',
  description: 'At least one of these fields are required for publication',
  type: 'error',
  validate(state) {
    return _reduce(state.components, function (errors, component, uri) {
      const fields = _find(blocked, (val, key) => helpers.getComponentName(uri) === key);

      // if the component is one of the blocked ones, validate it
      // and add to the errors
      if (fields) {
        validateComponent(errors, { uri, component, fields, schemas: state.schemas });
      }
      return errors;
    }, []);
  }
};
