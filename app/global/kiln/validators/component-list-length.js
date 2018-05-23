'use strict';

const helpers = require('./helpers'),
  _reduce = require('lodash/reduce'),
  _filter = require('lodash/filter'),
  _map = require('lodash/map'),
  _find = require('lodash/find'),
  cmpts = [
    // add a component, the field name of the component list you want to validate, and the min and max length here
    {
      name: 'image-gallery',
      listField: 'images',
      maxLength: 300,
      minLength: 5
    },
    {
      name: 'product-list',
      listField: 'content',
      maxLength: 300,
      minLength: 3
    }
  ];

/**
 * filterComponentsOnPage
 *
 * @param {Object} components
 * @returns {Array} component instances from the state that are of the types we're looking to validate
 */
function filterComponentsOnPage(components) {
  const componentNames = _map(cmpts, (c) => c.name); // get component names to look for

  // return only the components that appear in the list above
  return _filter(Object.keys(components), (name) => componentNames.indexOf(helpers.getComponentName(name)) > -1);
}

module.exports = {
  label: 'Component List Length',
  description: 'Component(s) on this page have component-list(s) that do not satisfy length requirements',
  type: 'error',
  validate(state) {
    let rules,
      list;

    return _reduce(filterComponentsOnPage(state.components), (errors, instance) => {
      rules = _find(cmpts, (cmpt) => cmpt.name === helpers.getComponentName(instance)); // get the "rules" for this component type
      list = state.components[instance][rules.listField]; // get the component list we're looking to validate

      if (list.length > rules.maxLength || list.length < rules.minLength) {
        errors.push({
          uri: instance,
          field: rules.listField,
          location: `${helpers.labelUtil(helpers.getComponentName(instance))}`,
          preview: list.length > rules.maxLength ? `The ${rules.listField} field cannot exceed ${rules.maxLength} items.` : `Must have at least ${rules.minLength} items in the ${rules.listField} list.`
        });
      }

      return errors;
    }, []);
  }
};
