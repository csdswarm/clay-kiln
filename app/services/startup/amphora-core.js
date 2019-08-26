'use strict';

const express = require('express'),
  amphora = require('amphora'),
  renderers = require('./amphora-renderers'),
  healthCheck = require('@nymdev/health-check'),
  permissionsPlugin = require('./amphora-permissions'),
  log = require('../universal/log').setup({ file: __filename }),
  { getComponentInstance } = require('../server/publish-utils'),
  { getComponentName, isComponent, isPage, isPublished } = require('clayutils'),
  { loadPermissions } = require('../../services/server/urps'),
  addPermissions = require('../../services/universal/user-permissions'),
  _set = require('lodash/set'),
  _get = require('lodash/get'),
  appRoot = require('app-root-path'),
  files = require('amphora-fs'),
  path = require('path'),
  YAML = require('yamljs'),
  componentsToCheck = getComponentsWithPermissions();

/**
 * loop through each component and add it to the list if it has a _permission
 *
 * @return {Array}
 */
function getComponentsWithPermissions() {
  const obj = {};

  // check each component
  files.getFolders([appRoot, 'components'].join(path.sep)).forEach((component) => {
    const path = files.getComponentPath(component),
      schema = YAML.load(files.getSchemaPath(path));

    if (schema._permission) { // the entire component has permissions
      _set(obj, component, schema._permission);
    } else { // a field on the component has permissions

      Object.keys(schema).forEach(field => {
        if (schema[field]._permission) {
          _set(obj, `${component}.${field}`, schema[field]._permission);
        }
      });
    }
  });

  return obj;
}

/**
 * middleware router to ensure that locals.user object obtains permissions
 *
 * @return {Router}
 */
function userPermissionRouter() {
  const ignorePaths = ['/_pages/'], // creating a new page dies when the user object is modified
    userPermissionRouter = express.Router();

  userPermissionRouter.all('/*', async (req, res, next) => {
    try {
      if (!ignorePaths.includes(req.path) && res.locals.user) {
        await loadPermissions(req.session, res.locals.user);
        addPermissions(res.locals.user);
      }
    } catch (e) {
      log('error', 'Error adding locals.user permissions', e);
    }
    next();
  });

  return userPermissionRouter;
}

/**
 * retrieves the data from the uri
 *
 * @param {string} uri
 * @param {string} [key]
 *
 * @return {object}
 */
async function getComponentData(uri, key) {
  const data = await getComponentInstance(uri.split('@')[0], {}) || {};

  return key ? _get(data, key) : data;
}

/**
 * check a component for field level permissions
 *
 * @param {string} uri
 * @param {string} component
 * @param {object} data
 * @param {object} locals
 *
 * @return {boolean|null}
 */
async function checkFieldPermission(uri, component, data, locals) {
  // get a copy of the unmodified data
  const instance = await getComponentData(uri);

  for (const field of Object.keys(componentsToCheck[component])) {
    // compare the fields or if no previous data
    if (JSON.stringify(instance[field]) !== JSON.stringify(data[field])) {
      // add condition for the specific fields
      const action = componentsToCheck[component][field];

      return locals.user.can(action).a(field).at(locals.station.callsign).value;
    }
  }
}

/**
 * determine if the current user has permissions to the specific item
 *
 * @param {string} uri
 * @param {object} data
 * @param {object} locals
 * @return {boolean}
 */
async function checkUserPermissions(uri, data, locals) {
  if (isComponent(uri)) {
    const component = getComponentName(uri);

    if (Object.keys(componentsToCheck).includes(component)) {
      const action = componentsToCheck[component]._permission;

      if (action) { // entire component
        return locals.user.can(action).a(component).at(locals.station.callsign).value;
      } else { // specific field in a component
        const fieldPermission = await checkFieldPermission(uri, component, data, locals);

        if (fieldPermission !== null) {
          return fieldPermission;
        }
      }
    }
  }

  if (isPage(uri) && isPublished(uri)) {
    try {
      const pageType = getComponentName(await getComponentData(uri, 'main[0]'));

      return locals.user.can('publish').a(pageType).at(locals.station.callsign).value;
    } catch (e) {
      log('error', e);
    }

    return false;
  }

  // if no permissions are required they can do it
  return true;
}

function initAmphora(app, search, sessionStore, routes) {
  return amphora({
    app,
    renderers,
    providers: ['google', 'cognito'],
    sessionStore,
    plugins: [
      search,
      routes,
      require('amphora-schedule'),
      permissionsPlugin(checkUserPermissions, userPermissionRouter())
    ],
    storage: require('amphora-storage-postgres'),
    eventBus: require('amphora-event-bus-redis')
  }).then(router => {
    router.use(healthCheck({
      env: [
        'AMBROSE_HOST',
        'REDIS_HOST',
        'ELASTIC_HOST',
        'CLAY_STORAGE_POSTGRES_HOST',
        'CLAY_BUS_HOST'
      ],
      stats: {
        searchExists: function () {
          return search.getInstance().ping();
        }
      },
      required: [
        'searchExists',
        'REDIS_HOST',
        'ELASTIC_HOST',
        'CLAY_BUS_HOST',
        'CLAY_STORAGE_POSTGRES_HOST'
      ]
    }));

    return router;
  });
}

module.exports = initAmphora;
