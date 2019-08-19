'use strict';

const _endsWith = require('lodash/endsWith'),
  KilnInput = window.kiln.kilnInput,
  PRELOAD_SUCCESS = 'PRELOAD_SUCCESS',
  /**
   * Check if a kiln.js file exists for a component, provide default function if not
   *
   * @param {string} component
   * @returns {function} kilnjs
   */
  getKilnJs = (component) => {
    let kilnjs;

    try {
      kilnjs = require(`${component}.kiln`);
    } catch (e) {
      kilnjs = schema => schema;
    }

    return kilnjs;
  },
  /**
   * Default hide a field and watch for load success to check user permissions
   *
   * @param {KilnInput} fieldInput
   * @param {object} permission
   */
  secureField = (fieldInput, permission) => {
    fieldInput.hide();

    fieldInput.subscribe(PRELOAD_SUCCESS, ({user, locals: {station}, url: {component}}) => {
      if (user.may(permission, component, station.callsign)) {
        fieldInput.show();
      }
    });
  },
  /**
   * Map through schema fields, find fields with permissions, and secure them
   * Then apply function from kiln.js
   *
   * @param {function} kilnjs
   * @param {string} componentPermission
   * @returns {function} secureKilnJs
   */
  secureSchema = (kilnjs, componentPermission) => (schema) => {
    Object.keys(schema).forEach(field => {
      if (schema[field]._permission || componentPermission) {
        schema[field] = new KilnInput(schema, field);

        secureField(schema[field], schema[field]._permission || componentPermission);
      }
    });

    return kilnjs(schema);
  },
  /**
   * Add a default kilnjs file in componentKilnJs for all components
   * If a kiln.js file already exists, wrap it with secured version
   */
  secureAllSchemas = () => {
    window.kiln = window.kiln || {};
    window.kiln.componentKilnjs = window.kiln.componentKilnjs || {};

    Object.keys(window.modules)
      .filter(key => _endsWith(key, '.model'))
      .forEach((key) => {
        const component = key.replace('.model', ''),
          kilnjs = getKilnJs(component);

        window.kiln.componentKilnjs[component] = secureSchema(kilnjs);
      });
  };

module.exports.secureField = secureField;
module.exports.secureSchema = secureSchema;
module.exports.secureAllSchemas = secureAllSchemas;
