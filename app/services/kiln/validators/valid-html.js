'use strict';

const { forEachComponent, forEachField, labelComponent } = window.kiln.utils.validationHelpers,
  _get = require('lodash/get'),
  _head = require('lodash/head'),
  validHTML = ({ value }) => {
    const doc = document.createElement('div');

    doc.innerHTML = value;
    return doc.innerHTML === value;
  };

module.exports = {
  label: 'Valid HTML Error',
  description: 'The field contains invalid HTML',
  type: 'error',
  async validate(state) {
    const errors = [];

    forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, field => {
      if (_get(field, 'validate.html') === true && !validHTML(field)) {
        errors.push({
          uri,
          field: _head(field.path.split('.')),
          location: `${labelComponent(uri)} » ${field.name}`
        });
      }
    }));

    return errors;
  }
};
