'use strict';

const addPermissions = require('../universal/user-permissions'),
  _camelCase = require('lodash/camelCase'),
  log = require('../universal/log').setup({ file: __filename }),
  KilnInput = window.kiln.kilnInput,
  PRELOAD_SUCCESS = 'PRELOAD_SUCCESS',
  preloadTimeout = 5000,
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
  * A helper method which subscribes to PRELOAD_SUCCESS and returns a promise
  *   of the first result.
  *
  * @param {object} subscriptions
  * @param {boolean} scoped
  * @returns {Promise}
  */
  whenPreloaded = (subscriptions, scoped = false) => {
    return new Promise((resolve, reject) => {
      try {
        setTimeout(() => {
          reject(new Error(`PRELOAD_SUCCESS wasn't published after ${preloadTimeout} ms`));
        }, preloadTimeout);

        subscriptions.subscribe(
          PRELOAD_SUCCESS,
          (...args) => {
            // this unsubscribes from the event as future event calls serve
            //   no purpose.
            delete subscriptions.subscribedEvents[PRELOAD_SUCCESS];
            resolve(...args);
          },
          scoped
        );
      } catch (err) {
        reject(err);
      }
    });
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
   * @param {string} component
   */
  secureField = async (fieldInput, permission, component) => {
    try {
      // Should actually be disabled/enabled instead of hide/show
      fieldInput.hide();

      const { user, locals: { station } } = await whenPreloaded(fieldInput),
        showInput = user.may(permission, component, station.callsign).value;

      if (showInput) {
        fieldInput.show();
      }
    } catch (err) {
      log('error', `error when securing the field '${fieldInput.inputName}' for component '${component}'`, err);
    }
  },
  /**
   * Map through schema fields, find fields with permissions, and secure them
   * Then apply function from kiln.js
   *
   * Use to secure an entire schema with one permission from a kiln.js file
   *
   * @param {function} kilnjs
   * @param {string} componentName
   * @param {string} [componentPermission]
   * @returns {function} secureKilnJs
   */
  secureSchema = (kilnjs, componentName, componentPermission) => (schema) => {
    Object.keys(schema).forEach(field => {
      const permission = schema[field]._permission || schema._permission || componentPermission;

      if (schema[field]._has && permission) {
        schema[field] = new KilnInput(schema, field);

        secureField(schema[field], permission, componentName);
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

    window.kiln.locals.components
      .forEach(component => {
        const kilnjs = getKilnJs(component);

        window.kiln.componentKilnjs[component] = secureSchema(kilnjs, component);
      });
  };

// kind of a hack, but NYMag does not have any early events where we can tie into in order to automatically add
// this to the user object, so we are accessing it directly off of the window
addPermissions(window.kiln.locals);

module.exports = {
  secureField,
  secureSchema,
  secureAllSchemas
};
