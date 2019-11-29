'use strict';

const appRoot = require('app-root-path'),
  express = require('express'),
  files = require('amphora-fs'),
  path = require('path'),
  bodyParser = require('body-parser'),
  { addMiddlewareToUnsafeMethods, isEditor, wrapInTryCatch } = require('./utils'),
  jsonBodyParser = bodyParser.json({ strict: true, type: 'application/json', limit: '50mb' });

/**
 *  passes the permission object to the permission function
 *
 * @param {Function} hasPermission
 * @param {object} db
 * @return {Function}
 */
function checkPermission(hasPermission, db) {
  return wrapInTryCatch(async (req, res, next) => {
    if (!isEditor(res.locals) || await hasPermission(req.uri, req, res.locals || {}, db)) {
      next();
    } else {
      res.status(403).send({ error: 'Permission Denied' });
    }
  });
}

/**
 * Set up permission checks for all components.
 * @param {Object} router
 * @param {Function} hasPermission - must return boolean
 * @param {Router} userRouter - router to apply to the permissionRouter for setting permissions based on locals.user
 * @param {Object} db - amphora's internal database connector
 */
function setupRoutes(router, hasPermission, userRouter, db) {
  const permissionRouter = express.Router(),
    checkPermissionMiddleware = checkPermission(hasPermission, db);

  // assume json or text for anything in request bodies
  permissionRouter.use(jsonBodyParser);

  // if a userRouter was passed in, add it to the permissionRouter
  if (userRouter) {
    permissionRouter.use('/', userRouter);
  }

  // check each component
  files.getFolders([appRoot, 'components'].join(path.sep)).forEach((folder) => {
    const path = ['', '_components', folder, 'instances', '*'].join('/');

    addMiddlewareToUnsafeMethods(permissionRouter, path, checkPermissionMiddleware);
  });

  // check all pages
  addMiddlewareToUnsafeMethods(permissionRouter, '/_pages/*', checkPermissionMiddleware);
  addMiddlewareToUnsafeMethods(permissionRouter, '/_uris/*', checkPermissionMiddleware);
  addMiddlewareToUnsafeMethods(permissionRouter, '/_lists/*', checkPermissionMiddleware);

  router.use('/', permissionRouter);
}

module.exports = setupRoutes;
