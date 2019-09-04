'use strict';

const addPermissions = require('../universal/user-permissions'),
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

    window.kiln.locals.components
      .forEach(component => {
        const kilnjs = getKilnJs(component);

        window.kiln.componentKilnjs[component] = secureSchema(kilnjs);
      });
  },
  /**
   * tests whether the node contains the class 'right-drawer'
   *
   * @param {Node} node
   * @returns {boolean}
   */
  isRightDrawer = (node) => {
    return node.classList && node.classList.contains('right-drawer');
  },
  /**
   * returns the publish button elements if they were added
   *
   * @param {object} mutation
   * @returns {object}
   */
  getAddedPublishButtons = (mutation) => {
    const publishDrawer = [...mutation.addedNodes].find(isRightDrawer);

    if (!publishDrawer) {
      return {};
    }

    return {
      publishBtn: publishDrawer.querySelector('.publish-actions > button'),
      unpublishBtn: publishDrawer.querySelector('.publish-status > button')
    };
  },
  /**
   * A helper method which subscribes to PRELOAD_SUCCESS and returns a promise
   *   of the first result.
   *
   * @param {object} subscriptions
   * @param {boolean} scoped
   * @returns {Promise}
   */
  getWhenPreloaded = (subscriptions, scoped = false) => {
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
      whenPreloaded = getWhenPreloaded(subscriptions);

    subscriptions.subscribe('OPEN_DRAWER', async payload => {
      if (payload !== 'publish-page') {
        return;
      }

      const { locals } = await whenPreloaded,
        hasAccess = locals.user.hasPermissionsTo('access').this('station');

      if (hasAccess) {
        return;
      }

      // shouldn't be declared above the short circuit
      // eslint-disable-next-line one-var
      const publishBtn = document.querySelector('.right-drawer .publish-actions > button'),
        unpublishBtn = document.querySelector('.right-drawer .publish-status > button');

      // if this was rendered on the server then there won't be any mutations
      if (publishBtn || unpublishBtn) {
        if (publishBtn) {
          publishBtn.style.display = 'none';
        }
        if (unpublishBtn) {
          unpublishBtn.style.display = 'none';
        }

        return;
      }

      // this shouldn't be declared above the short circuit
      // eslint-disable-next-line one-var
      const kilnWrapper = document.querySelector('.kiln-wrapper'),
        observer = new MutationObserver(mutationList => {
          for (const mutation of mutationList) {
            const { publishBtn, unpublishBtn } = getAddedPublishButtons(mutation);

            if (publishBtn) {
              publishBtn.style.display = 'none';
            }
            if (unpublishBtn) {
              unpublishBtn.style.display = 'none';
            }
            if ([...mutation.removedNodes].find(isRightDrawer)) {
              observer.disconnect();
            }
          }
        });

      observer.observe(kilnWrapper, { childList: true });
    }, false);
  };

// kind of a hack, but NYMag does not have any early events where we can tie into in order to automatically add
// this to the user object, so we are accessing it directly off of the window
addPermissions(window.kiln.locals);

module.exports.secureField = secureField;
module.exports.secureSchema = secureSchema;
module.exports.secureAllSchemas = secureAllSchemas;
module.exports.publishRights = publishRights;

