'use strict';

const addPermissions = require('../universal/user-permissions'),
  whenRightDrawerExists = require('./when-right-drawer-exists'),
  { setEachToDisplayNone } = require('../client/dom-helpers'),
  preloadTimeout = 5000,
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
    // Should actually be disabled/enabled instead of hide/show
    fieldInput.hide();

    fieldInput.subscribe(PRELOAD_SUCCESS, ({user, locals: {station}, url: {component}}) => {
      if (user.may(permission, component, station.callsign).value) {
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

      if (permission && permission._has) {
        console.warn(`The ${schema.schemaName} component was upgraded causing the _permission to become corrupted.`,
          `Upgrade the /app/components/${schema.schemaName}/schema.yml to enable permissions.`);
      } else if (schema[field]._has && permission) {
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

    window.kiln.locals.components
      .forEach(component => {
        const kilnjs = getKilnJs(component);

        window.kiln.componentKilnjs[component] = secureSchema(kilnjs);
      });
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
   * hides the 'publish' or 'unpublish' button if the user does not
   *   have permissions
   *
   * @param {object} schema - only used because KilnInput requires it
   **/
  publishRights = (schema) => {
    const subscriptions = new KilnInput(schema),
      whenPreloadedPromise = whenPreloaded(subscriptions);

    whenRightDrawerExists(subscriptions, async rightDrawerEl => {
      const { locals } = await whenPreloadedPromise,
        hasAccess = locals.user.hasPermissionsTo('access').this('station');

      if (hasAccess) {
        return;
      }

      // these shouldn't be declared above the short circuit
      // eslint-disable-next-line one-var
      const publishBtn = rightDrawerEl.querySelector('.publish-actions > button'),
        unpublishBtn = rightDrawerEl.querySelector('.publish-status > button');

      setEachToDisplayNone([publishBtn, unpublishBtn]);
    });
  },
  /**
   * mutates the schema blocking the user from being able to add/remove items from a simple-list if they do not have permissions
   *
   * @param {object} schema
   * @param {string} field
   * @param {string} [component]
   *
   * @return {object} - schema
   */
  simpleListRights = (schema, field, component = schema.schemaName) => {
    const subscriptions = new KilnInput(schema);

    subscriptions.subscribe(PRELOAD_SUCCESS, async ({ locals }) => {
      schema[field]._has.autocomplete.allowCreate = locals.user.isAbleTo('create').using(component).value;
      schema[field]._has.autocomplete.allowRemove = locals.user.isAbleTo('update').using(component).value;
    });

    return schema;
  };

// kind of a hack, but NYMag does not have any early events where we can tie into in order to automatically add
// this to the user object, so we are accessing it directly off of the window
addPermissions(window.kiln.locals);

module.exports.secureField = secureField;
module.exports.secureSchema = secureSchema;
module.exports.secureAllSchemas = secureAllSchemas;
module.exports.publishRights = publishRights;
module.exports.simpleListRights = simpleListRights;

