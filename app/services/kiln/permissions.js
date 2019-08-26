'use strict';

const _endsWith = require('lodash/endsWith'),
  _isString = require('lodash/isString'),
  addPermissions = require('../universal/user-permissions'),
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
   * Permission can be a string, or an object with an action and target
   *
   * Use to secure a field within a kiln.js file
   *
   * @param {KilnInput} fieldInput
   * @param {string|object} permission
   */
  secureField = (fieldInput, permission) => {
    const {action, target} = _isString(permission) ? {action: permission} : permission;

    // Should actually be disabled/enabled instead of hide/show
    fieldInput.hide();

    fieldInput.subscribe(PRELOAD_SUCCESS, ({user, locals: {station}, url: {component}}) => {
      addPermissions(user);

      if (user.may(action, target || component, station.callsign)) {
        fieldInput.show();
      }
    });
  },
  /**
   * Map through schema fields, find fields with permissions, and secure them
   * Then apply function from kiln.js
   *
   * Use to secure an entire schema with one permission from a kiln.js file
   *
   * @param {function} kilnjs
   * @param {string} [componentPermission]
   * @returns {function} secureKilnJs
   */
  secureSchema = (kilnjs, componentPermission) => (schema) => {
    Object.keys(schema).forEach(field => {
      const permission = schema[field]._permission || schema._permission || componentPermission;

      if (schema[field]._has && permission) {
        schema[field] = new KilnInput(schema, field);

        secureField(schema[field], permission);
      }
    });

    return kilnjs(schema);
  },
  /**
   * Add a default kilnjs file in componentKilnJs for all components
   * If a kiln.js file already exists, wrap it with secured version
   *
   * Secures every field with a _permissions field in the schema.yml
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
