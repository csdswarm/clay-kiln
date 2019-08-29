'use strict';

const _endsWith = require('lodash/endsWith'),
  addPermissions = require('../universal/user-permissions'),
  _camelCase = require('lodash/camelCase'),
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
   * Use to secure a field within a kiln.js file
   *
   * @param {KilnInput} fieldInput
   * @param {string} permission
   */
  secureField = (fieldInput, permission) => {
    // Should actually be disabled/enabled instead of hide/show
    fieldInput.hide();

    fieldInput.subscribe(PRELOAD_SUCCESS, (data) => {
      const {user, locals: {station}, url: {component}} = data;

      if (user.may(permission, component, station.callsign)) {
        fieldInput.show();
      }
    }, true);
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
  },
  /**
   * mutates the schema blocking the user from being able to publish if they do not have permissions
   *
   * @param {object} schema
   */
  publishRights = (schema) => {
    const subscriptions = new KilnInput(schema);

    subscriptions.subscribe(PRELOAD_SUCCESS, async ({ locals }) => {

      const { value, message } = locals.user.can('publish').a(schema.schemaName);

      if (!value) {
        const name = _camelCase(message);

        // using the name the message, it will display the message in the error list
        schema[name] = new KilnInput(schema, name);
        schema[name].setProp('_has', {
          ...schema[name]['_has'],
          input: 'text',
          validate: {
            required: true
          }
        });
        schema[name].hide();
      }
    }, true);
  };

// kind of a hack, but NYMag does not have any early events where we can tie into in order to automatically add
// this to the user object, so we are accessing it directly off of the window
addPermissions(window.kiln.locals);

module.exports.secureField = secureField;
module.exports.secureSchema = secureSchema;
module.exports.secureAllSchemas = secureAllSchemas;
module.exports.publishRights = publishRights;
