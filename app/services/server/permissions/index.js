'use strict';

const express = require('express'),
  log = require('../../universal/log').setup({ file: __filename }),
  {
    getComponentName,
    getPageInstance,
    isComponent,
    isPage,
    isPublished,
    isUri,
    isPageMeta,
    isList,
    getListInstance
  } = require('clayutils'),
  urps = require('../urps'),
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
  hasPermissions = require('./has-permissions'),
  { getComponentData } = require('../db'),
  addToLocals = require('./add-to-locals'),
  updateLocals = require('./update-locals'),
  getPageTemplateIds = require('../get-page-template-ids'),
  { wrapInTryCatch } = require('../../startup/middleware-utils'),
  { refreshPath } = require('../../../routes/add-endpoints/refresh-permissions');

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

  userPermissionRouter.use('/', wrapInTryCatch(async (req, res, next) => {
    const { locals } = res;

    if (_get(locals, 'user.provider') === 'cognito') {
      await urps.updateAuthData(req.session, locals);
    }

    next();
  }));

  // loadPermissions uses stationsIHaveAccessTo which means this middleware must
  //   come first
  addToLocals.stationsIHaveAccessTo(userPermissionRouter);
  updateLocals.stationForPermissions(userPermissionRouter);

  userPermissionRouter.use('/', async (req, res, next) => {
    // if we're refreshing permissions then don't load permissions because they
    //   may get loaded twice
    if (req.path === refreshPath) {
      return next();
    }

    try {
      const { locals } = res;

      if (locals.user) {
        const { provider } = res.locals.user;

        if (provider === 'cognito') {
          await urps.loadStationPermissions(req.session, locals);
          locals.permissions = req.session.auth.permissions;
        }
        addPermissions(locals);

        locals.componentPermissions = componentsToCheck;
      }
    } catch (e) {
      log('error', 'Error adding locals.user permissions', e);
    }
    next();
  });

  interceptLists(userPermissionRouter);

  addToLocals.stationsICanImportContent(userPermissionRouter);

  // updatePermissionsInfo needs to go after stationsIHaveAccessTo
  addToLocals.updatePermissionsInfo(userPermissionRouter);

  // we need access to 'res' in these so a proper 400 error can be returned
  //   when a bad station identifier is sent.
  hasPermissions.createPage(userPermissionRouter);
  hasPermissions.importContent(userPermissionRouter);
  hasPermissions.createOrUpdateAlerts(userPermissionRouter);

  // we're restricting editPageTemplate here instead of in checkUserPermissions
  //   because that function will be kept much simpler if we leave it
  //   intercepting unsafe methods (here we're intercepting
  //   GET /_pages/...?edit=true)
  hasPermissions.editPageTemplate(userPermissionRouter);

  return userPermissionRouter;
}

/**
 * determines if a user has permissions to perform an action on a list
 * @param {string} component
 * @param {boolean} forList - 'true' if the permissions being tested is for a list rather
 *  rather than component data. this is important because with lists we need to prevent
 *  users from removing items but for components removing list items is fine.
 * @param {string} field
 * @param {object} data
 * @param {object} db
 * @param {object} locals
 *
 * @return {Promise<boolean>}
 */
async function hasListPermissions({ forList, component, field, data, db, locals }) {
  const existingItems = (await db.get(`${process.env.CLAY_SITE_HOST}/_lists/${component}`))
      .map(item => item.text),
    permissions = componentsToCheck._lists[component].field[field],
    create = permissions.create,
    remove = permissions.remove,
    blockAdd = !locals.user.hasPermissionsTo(create).a(component).value,
    blockRemove = forList && !locals.user.hasPermissionsTo(remove).a(component).value,
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
      req.body = await getComponentData(uri);
    }
  } else { // specific fields
    let data;
    const resetData = async (field) => {
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
    const { user } = locals,
      { site_slug } = locals.stationForPermissions;

    // no matter the request, verify the user has can has the record for this site
    if (!locals.stationsIHaveAccessTo[site_slug]) {
      return false;
    }

    if (isComponent(uri)) {
      await checkComponentPermission(uri, req, locals, db);
    }

    // TODO: handle page meta
    if (
      isPage(uri)
      && !isPageMeta(uri)
      && req.method === 'PUT'
    ) {
      const pageId = getPageInstance(uri),
        canEditPageTemplate = user.can('update').a('page-template').value;

      if (isPublished(uri)) {
        const pageType = getComponentName(await getComponentData(uri, 'main[0]'));

        // only static-page has particular publish permissions at the moment
        return pageType === 'static-page'
          ? user.can('publish').a(pageType).value
          : true;
      } else if (
        !canEditPageTemplate
        && (await getPageTemplateIds(locals)).has(pageId)
      ) {
        return false;
      }
    }

    if (isUri(uri) && req.method === 'DELETE') {
      const pageUri = await db.get(req.uri),
        pageData = await db.get(pageUri),
        pageType = getComponentName(pageData.main[0]);

      return pageTypesToCheck.has(pageType)
        ? user.can('unpublish').a(pageType).value
        : true;
    }

    if (isList(uri) && req.method === 'PUT') {
      const list = getListInstance(uri);

      if (Object.keys(componentsToCheck._lists || {}).includes(list)) {
        let allow = true;

        for (const field of Object.keys(componentsToCheck._lists[list].field)) {
          const hasPermissions = await hasListPermissions({
            forList: true,
            component: list,
            field,
            data: req.body,
            db,
            locals
          });

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
