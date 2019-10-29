'use strict';

const express = require('express'),
  log = require('../../universal/log').setup({ file: __filename }),
  { getComponentName, isComponent, isPage, isPublished, isUri, isPageMeta, isList, getListInstance } = require('clayutils'),
  { loadPermissions } = require('../urps'),
  { getMainComponentsForPageUri } = require('../db'),
  addPermissions = require('../../universal/user-permissions'),
  _set = require('lodash/set'),
  _get = require('lodash/get'),
  appRoot = require('app-root-path'),
  amphoraFiles = require('amphora-fs'),
  path = require('path'),
  { URL } = require('url'),
  YAML = require('yamljs'),
  interceptLists = require('./intercept-lists'),
  componentsToCheck = getComponentsWithPermissions(),
  { pageTypesToCheck } = require('./utils'),
  hasPermissions = require('./has-permissions'),
  { getComponentData } = require('../db'),
  attachToLocals = require('./attach-to-locals'),
  typesOfPages = {
    homepage: 'the home page',
    'section-front': 'section fronts',
    'static-page': 'static pages'
  };

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
      const { locals } = res;

      if (locals.user) {
        const { provider } = res.locals.user;

        if (provider === 'cognito') {
          await loadPermissions(req.session, locals);
        } else if (provider === 'google') {
          locals.permissions = { station: { access: { station: { 'NATL-RC': 1 } } } };
        }
        addPermissions(locals);

        Object.assign(
          locals,
          await checkUpdatePrivileges(locals),
          { componentPermissions: componentsToCheck }
        );
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
  attachToLocals.stationsIHaveAccessTo(userPermissionRouter);

  return userPermissionRouter;
}

/**
 * Verifies if user has privileges to update the uri
 * @param {Object} locals The locals object
 * @returns {Promise<object>}
 */
async function checkUpdatePrivileges(locals) {
  const {url, edit, user, station } = locals,
    urlParser = new URL(url),
    uri = `${urlParser.host}${urlParser.pathname}`;

  try {
    if (edit === 'true') {
      const mainComponents = await getMainComponentsForPageUri(uri);

      for (const component of mainComponents) {
        const pageType = getComponentName(component);

        if (pageType === 'static-page') {
          return {
            showLackOfEditPermissionsBanner: !user.can('update').a(pageType).value,
            updateTarget: `${typesOfPages[pageType]} for ${station.name}`
          };
        }
      }
    }
  } catch (error) {
    log(
      'error',
      `There was an error trying to check for update privileges for user: ${user} on page: ${uri}`,
      error
    );
  }
}

/**
 * determines if a user has permissions to perform an action on a list
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
    const { user } = locals;

    // no matter the request, verify the user has can has the record for this site
    if (!user.hasPermissionsTo('access').this('station').value) {
      return false;
    }

    if (isComponent(uri)) {
      await checkComponentPermission(uri, req, locals, db);
    }

    if (isPage(uri) && !isPageMeta(uri)) {
      if (isPublished(uri)) {
        const pageType = getComponentName(await getComponentData(uri, 'main[0]'));

        return pageTypesToCheck.has(pageType)
          ? user.can('publish').a(pageType).value
          : true;
      } else if (req.method === 'POST') {
        const pageType = getComponentName(req.body.main[0]);

        return pageTypesToCheck.has(pageType)
          ? locals.user.can('create').a(pageType).value
          : true;
      } else if (req.method === 'GET') {
        /*
        Why are we preventing a GET when a page can't be updated?
        In short, this is a workaround to a problem where components are updated separately from
        the page. When the component PUT requests come in, it's *extremely* difficult at this time
        to determine what page they belong to.
        This workaround basically prevents the page editor from working when the user does not have
        permissions, so it provides "some" security for those who would unintentionally edit something
        they don't have permissions to. Remove it when we work out how to prevent component level
        PUT requests appropriately.
        * */
        const pageType = getComponentName(await getComponentData(db, uri, 'main[0]'));

        return pageType === 'static-page'
          ? locals.user.can('update').a(pageType).value
          : true;
      }
    }

    if (isUri(uri) && req.method === 'DELETE') {
      const pageUri = await db.get(req.uri),
        pageData = await db.get(pageUri),
        pageType = getComponentName(pageData.main[0]),
        { station } = locals;

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
