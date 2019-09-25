'use strict';

const express = require('express'),
  log = require('../../universal/log').setup({ file: __filename }),
  { getComponentName, isComponent, isPage, isPublished, isUri, isList, getListInstance } = require('clayutils'),
  { loadPermissions } = require('../urps'),
  addPermissions = require('../../universal/user-permissions'),
  _set = require('lodash/set'),
  _get = require('lodash/get'),
  appRoot = require('app-root-path'),
  amphoraFiles = require('amphora-fs'),
  path = require('path'),
  YAML = require('yamljs'),
  interceptLists = require('./intercept-lists'),
  componentsToCheck = getComponentsWithPermissions(),
  { pageTypesToCheck } = require('./utils'),
  hasPermissions = require('./has-permissions');

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
        // specific check for lists
        if (schema[field]._list_permission) {
          _set(obj, `_lists.${component}.field.${field}`, schema[field]._list_permission);
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

        res.locals.componentPermissions = componentsToCheck;
      }
    } catch (e) {
      log('error', 'Error adding locals.user permissions', e);
    }
    next();
  });

  interceptLists(userPermissionRouter);

  // we need access to 'res' in createPage so a proper 400 error can be returned
  //   when a bad station slug is sent.
  hasPermissions.createPage(userPermissionRouter);

  return userPermissionRouter;
}

/**
 * retrieves the data from the uri
 *
 * @param {object} db - amphora's internal db instance
 * @param {string} uri
 * @param {string} [key]
 *
 * @return {object}
 */
async function getComponentData(db, uri, key) {
  const data = await db.get(uri.split('@')[0]) || {};

  return key ? _get(data, key) : data;
}

/**
 * determines if a user has permissions to perform an action on a list
 *
 * @param {string} component
 * @param {string} field
 * @param {object} data
 * @param {object} db
 * @param {object} locals
 *
 * @return {Promise<boolean>}
 */
async function hasListPermissions({ component, field, data, db, locals }) {
  const existingItems = (await db.get(`${process.env.CLAY_SITE_HOST}/_lists/${component}`))
      .map(item => item.text),
    permissions = componentsToCheck._lists[component].field[field],
    create = permissions.create,
    remove = permissions.remove,
    blockAdd = !locals.user.hasPermissionsTo(create).a(component).value,
    blockRemove = !locals.user.hasPermissionsTo(remove).a(component).value,
    listData = data.map(item => item.text),
    addedToList = () => Boolean(listData.find(item => !existingItems.includes(item))),
    removedFromList = () => Boolean(existingItems.find(item => !listData.includes(item)));

  return !(blockAdd && addedToList()) && !(blockRemove && removedFromList());
}

/**
 * check a component for field level permissions and modify the request with old data if they do not have permissions
 *
 * @param {string} uri
 * @param {object} req
 * @param {object} locals
 * @param {object} db - amphora's internal db instance
 */
async function checkComponentPermission(uri, req, locals, db) {
  const component = getComponentName(uri);

  if (!componentsToCheck[component] && !componentsToCheck._lists[component]) {
    return;
  }

  if (_get(componentsToCheck, `${component}.component`)) { // entire component
    const action = componentsToCheck[component].component;

    if (!locals.user.can(action).a(component).value) {
      // no permissions to modify this component, so reset the value to what it had been
      req.body = await getComponentData(db, uri);
    }
  } else { // specific fields
    let data;
    const resetData = async (field) => {
      // only get the component data once inside the loop
      if (!data) {
        data = await getComponentData(db, uri);
      }

      // if the field exists already override it, else remove it so it matches what it had been
      if (data[field]) {
        req.body[field] = data[field];
      } else {
        delete req.body[field];
      }
    };

    for (const field of Object.keys(_get(componentsToCheck, `${component}.field`, {}))) {
      // add condition for the specific fields
      const action = componentsToCheck[component].field[field];

      if (!locals.user.can(action).a(field).value) {
        await resetData(field);
      }
    }

    if (_get(componentsToCheck, `_lists.${component}`)) {
      for (const field of Object.keys(_get(componentsToCheck, `_lists.${component}.field`, {}))) {
        const hasPermissions = await hasListPermissions({ component, field, data: req.body[field], db, locals });

        if (!hasPermissions) {
          await resetData(field);
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
 * @param {object} db - amphora's internal db instance
 * @return {boolean}
 */
async function checkUserPermissions(uri, req, locals, db) {
  try {
    // no matter the request, verify the user has can has the record for this site
    if (!locals.user.hasPermissionsTo('access').this('station').value) {
      return false;
    }

    if (isComponent(uri)) {
      await checkComponentPermission(uri, req, locals, db);
    }

    if (isPage(uri) && isPublished(uri)) {
      const pageType = getComponentName(await getComponentData(db, uri, 'main[0]'));

      return pageTypesToCheck.has(pageType)
        ? locals.user.can('publish').a(pageType).value
        : true;
    }

    if (isUri(uri) && req.method === 'DELETE') {
      const pageUri = await db.get(req.uri),
        pageData = await db.get(pageUri),
        pageType = getComponentName(pageData.main[0]),
        { station, user } = locals;

      return pageTypesToCheck.has(pageType)
        ? user.can('unpublish').a(pageType).at(station.callsign).value
        : true;
    }

    if (isList(uri) && req.method === 'PUT') {
      const list = getListInstance(uri);

      if (Object.keys(componentsToCheck._lists || {}).includes(list)) {
        let allow = true;

        for (const field of Object.keys(componentsToCheck._lists[list].field)) {
          const hasPermissions = await hasListPermissions({ component: list, field, data: req.body, db, locals });

          allow = !hasPermissions ? false : allow;
        }

        return allow;
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
