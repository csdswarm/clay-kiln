'use strict';

const addPermissions = require('../universal/user-permissions'),
  log = require('../universal/log').setup({ file: __filename }),
  whenRightDrawerExists = require('./when-right-drawer-exists'),
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
      const { user } = await whenPreloaded(fieldInput),
        disableInput = !user.may(permission, component).value;

      if (disableInput) {
        fieldInput.setProp('disabled', true);
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

      if (permission && permission._has) {
        console.warn(`The ${schema.schemaName} component was upgraded causing the _permission to become corrupted.`,
          `Upgrade the /app/components/${schema.schemaName}/schema.yml to enable permissions.`);
      } else if (schema[field]._has && permission) {
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
  },
  /**
   * hides the 'publish' or 'unpublish' button if the user does not
   *   have permissions
   *
   * @param {object} schema
   * @param {object} opts
   * @param {boolean} opts.checkStationAccess - determines whether this method should
   *   only enforce publish rights based off station access.  This makes sense
   *   for content types which allow all roles to publish such as article
   *   and gallery.
   **/
  enforcePublishRights = (schema, { checkStationAccessFor }) => {
    const { schemaName } = schema,
      kilnInput = new KilnInput(schema),
      whenPreloadedPromise = whenPreloaded(kilnInput);

    whenRightDrawerExists(kilnInput, async rightDrawerEl => {
      const { locals } = await whenPreloadedPromise,
        { site_slug } = locals.stationForPermissions,
        hasAccess = !!locals.stationsIHaveAccessTo[site_slug],
        canPublish = checkStationAccessFor.publish
          ? hasAccess
          : locals.user.can('publish').a(schemaName).value,
        canUnpublish = checkStationAccessFor.unpublish
          ? hasAccess
          : locals.user.can('unpublish').a(schemaName).value;

      if (canPublish && canUnpublish) {
        return;
      }

      // shouldn't be declared above the short circuit
      // eslint-disable-next-line one-var
      const publishBtn = rightDrawerEl.querySelector('.publish-actions > button'),
        unpublishBtn = rightDrawerEl.querySelector('.publish-status > button');

      if (!canPublish && publishBtn) {
        publishBtn.style.display = 'none';
      }
      if (!canUnpublish && unpublishBtn) {
        unpublishBtn.style.display = 'none';
      }
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
      schema[field]._has.autocomplete.allowRemove = locals.user.isAbleTo('remove').using(component).value;
    });

    return schema;
  };

// kind of a hack, but NYMag does not have any early events where we can tie into in order to automatically add
// this to the user object, so we are accessing it directly off of the window
addPermissions(window.kiln.locals);

module.exports = {
  enforcePublishRights,
  secureAllSchemas,
  secureField,
  secureSchema,
  simpleListRights
};
