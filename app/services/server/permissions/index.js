'use strict';

const express = require('express'),
  log = require('../../universal/log').setup({ file: __filename }),
  { getComponentName, isComponent, isPage, isPublished, isUri, isPageMeta } = require('clayutils'),
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
  pageTypesToCheck = new Set(['homepage', 'section-front', 'static-page']),
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
    const { locals } = res;

    try {
      if (locals.user) {
        if (locals.user.provider === 'cognito') {
          await loadPermissions(req.session, locals);
        }
        addPermissions(locals);

        Object.assign(
          locals,
          await checkUpdatePrivileges(locals)
        );
      }
    } catch (e) {
      log('error', 'Error adding locals.user permissions', e);
    }
    next();
  });

  interceptLists(userPermissionRouter);

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
            canEditPage: user.can('update').a(pageType).value,
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
  return { canEditPage: true };
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
 * check a component for field level permissions and modify the request with old data if they do not have permissions
 *
 * @param {string} uri
 * @param {object} req
 * @param {object} locals
 * @param {object} db - amphora's internal db instance
 */
async function checkComponentPermission(uri, req, locals, db) {
  const component = getComponentName(uri);

  if (!componentsToCheck[component]) {
    return;
  }

  if (componentsToCheck[component].component) { // entire component
    const action = componentsToCheck[component].component;

    if (!locals.user.can(action).a(component).value) {
      // no permissions to modify this component, so reset the value to what it had been
      req.body = await getComponentData(db, uri);
    }
  } else { // specific fields
    for (const field of Object.keys(componentsToCheck[component].field)) {
      // add condition for the specific fields
      const action = componentsToCheck[component].field[field];

      if (!locals.user.can(action).a(field).value) {
        let data;

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
  const { user } = locals;

  try {
    // no matter the request, verify the user has can has the record for this site
    if (!user.hasPermissionsTo('access').this('station').value) {
      return false;
    }

    if (isComponent(uri)) {
      await checkComponentPermission(uri, req, locals, db);
    }

    if (isPage(uri)) {
      if (isPublished(uri)) {
        const pageType = getComponentName(await getComponentData(db, uri, 'main[0]'));

        return pageTypesToCheck.has(pageType)
          ? locals.user.can('publish').a(pageType).value
          : true;
      } else if (req.method === 'POST') {
        const pageType = getComponentName(req.body.main[0]);

        return pageTypesToCheck.has(pageType)
          ? locals.user.can('create').a(pageType).value
          : true;
      } else if (req.method === 'GET' && !isPageMeta(uri)) {
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


    // if no permissions are required they can do it
    return true;
  } catch (e) {
    log('error', 'Error checking user permissions', e);

    return false;
  }
}

module.exports.checkUserPermissions = checkUserPermissions;
module.exports.userPermissionRouter = userPermissionRouter;
