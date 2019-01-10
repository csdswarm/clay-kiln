'use strict';

const helpers = require('./helpers'),
  _filter = require('lodash/filter'),
  validations = [{
    componentName: 'subscription-plan',
    filter(component) {
      return component.data.isDefaultSelection === true;
    },
    hasErrors(componentsOnPage, filteredComponents) {
      return componentsOnPage.length && filteredComponents.length !== 1;
    },
    targetField: 'isDefaultSelection',
    previewMessage: 'Only one default plan may be selected'
  }];

module.exports = {
  label: 'One Required Selection',
  description: 'Must be only one selected',
  type: 'error',
  validate(state) {
    const result = [];

    validations.forEach(validation => {
      const componentsUri = Object.keys(state.components),
        componentsOnPage = _filter(componentsUri, uri => helpers.getComponentName(uri) === validation.componentName)
          .map(uri => ({data: state.components[uri], uri})),
        filteredComponents = componentsOnPage.filter(validation.filter);

      if (validation.hasErrors(componentsOnPage, filteredComponents)) {
        const firstComponent = filteredComponents.length ? filteredComponents[0] : componentsOnPage[0];

        result.push({
          uri: firstComponent.uri,
          field: validation.targetField,
          preview: validation.previewMessage,
          location: helpers.labelUtil(helpers.getComponentName(firstComponent.uri))
        });
      }
    });

    return result;
  },
  validations: validations
};
