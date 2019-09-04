'use strict';

const express = require('express'),
  log = require('../universal/log').setup({ file: __filename }),
  { getComponentInstance } = require('../server/publish-utils'),
  { getComponentName, isComponent } = require('clayutils'),
  { loadPermissions } = require('../../services/server/urps'),
  addPermissions = require('../../services/universal/user-permissions'),
  _set = require('lodash/set'),
  _get = require('lodash/get'),
  appRoot = require('app-root-path'),
  amphoraFiles = require('amphora-fs'),
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
  amphoraFiles.getFolders([appRoot, 'components'].join(path.sep)).forEach((component) => {
    const path = amphoraFiles.getComponentPath(component),
      schema = YAML.load(amphoraFiles.getSchemaPath(path));

    if (schema._permission) { // the entire component has permissions
      _set(obj, `${component}.component`, schema._permission);
    } else { // a field on the component has permissions
      Object.keys(schema).forEach(field => {
        if (schema[field]._permission) {
          _set(obj, `${component}.field.${field}`, schema[field]._permission);
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
  const userPermissionRouter = express.Router();

  userPermissionRouter.all('/*', async (req, res, next) => {
    try {
      if (res.locals.user) {
        if (res.locals.user.provider === 'cognito') {
          await loadPermissions(req.session, res.locals);
        }
        addPermissions(res.locals);
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
 * check a component for field level permissions and modify the request with old data if they do not have permissions
 *
 * @param {string} uri
 * @param {string} component
 * @param {object} req
 * @param {object} locals
 */
async function checkComponentPermission(uri, component, req, locals) {
  if (componentsToCheck[component].component) { // entire component
    const action = componentsToCheck[component].component;

    if (!locals.user.can(action).a(component).value) {
      // no permissions to modify this component, so reset the value to what it had been
      req.body = await getComponentData(uri);
    }
  } else { // specific fields
    for (const field of Object.keys(componentsToCheck[component].field)) {
      // add condition for the specific fields
      const action = componentsToCheck[component].field[field];

      if (!locals.user.can(action).a(field).value) {
        let data;

        // only get the component data once inside the loop
        if (!data) {
          data = await getComponentData(uri);
        }

        // if the field exists already override it, else remove it so it matches what it had been
        if (data[field]) {
          req.body[field] = data[field];
        } else {
          delete req.body[field];
        }
      }
    }
  }
}

/**
 * determine if the current user has permissions to the specific item
 *
 * @param {string} uri
 * @param {object} req
 * @param {object} locals
 * @return {boolean}
 */
async function checkUserPermissions(uri, req, locals) {
  try {
    // no matter the request, verify the user has can has the record for this site
    if (!locals.user.hasPermissionsTo('access').this('station').value) {
      return false;
    }

    if (isComponent(uri)) {
      const component = getComponentName(uri);

      if (componentsToCheck[component]) {
        await checkComponentPermission(uri, component, req, locals);
      }
    }

    // if no permissions are required they can do it
    return true;
  } catch (e) {
    log('error', 'Error checking user permissions', e);

    return false;
  }
}

module.exports.checkUserPermissions = checkUserPermissions;
module.exports.userPermissionRouter = userPermissionRouter;
