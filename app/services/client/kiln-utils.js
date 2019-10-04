'use strict';

const KilnInput = window.kiln.kilnInput,
  { getComponentName } = require('clayutils'),
  _get = require('lodash/get'),
  /**
   * keep fields in sync for a component
   *
   * @param {Object} schema
   * @param {Object} componentFields
   *
   * @return {Object} schema
   */
  syncFields = (schema, componentFields) => {
    const kilnInput = new KilnInput(schema),
      defaultPayload = {
        uri: '',
        data: {
          url: ''
        },
        fields: []
      };

    kilnInput.subscribe('UPDATE_COMPONENT', async (payload = defaultPayload) => {
      const { uri, data, fields } = payload;

      Object.keys(componentFields).forEach(component => {
        if (getComponentName(uri) === component) {
          let save = false;

          Object.keys(componentFields[component]).forEach(modifiedField => {
            if (fields.includes(modifiedField)) {
              componentFields[component][modifiedField].forEach(field => {
                const maxLength = _get(schema, `${field}._has.validate.max`);

                data[field] = maxLength ? data[modifiedField].substring(0, maxLength) : data[modifiedField];
                save = true;
              });
            }
          });

          if (save) {
            // must save the data back and re-render to take effect
            kilnInput.saveComponent(uri, data);
          }
        }
      });
    });

    return schema;
  },
  /**
   * keep headlines in sync for a component
   *
   * @param {string} component
   *
   * @return {Object} fields
   */
  syncHeadlines = component => {
    const fields = {};

    fields[component] =  {
      headline: ['primaryHeadline', 'shortHeadline', 'teaser', 'plaintextPrimaryHeadline']
    };

    return fields;
  };

module.exports.syncFields = syncFields;
module.exports.syncHeadlines = syncHeadlines;
