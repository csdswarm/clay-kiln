'use strict';

const appRoot = require('app-root-path'),
  express = require('express'),
  files = require('amphora-fs'),
  path = require('path'),
  bodyParser = require('body-parser'),
  jsonBodyParser = bodyParser.json({ strict: true, type: 'application/json', limit: '50mb' });

/**
 *  passes the permission object to the permission function
 *
 * @param {Function} hasPermission
 * @return {Function}
 */
function checkPermission(hasPermission) {
  return async (req, res, next) => {
    if (await hasPermission(req.uri, req.body, res.locals || {})) {
      next();
    } else {
      res.status(403).send({ error: 'Permission Denied' });
    }
  };
}

/**
 * Set up permission checks for all components.
 * @param {Object} router
 * @param {Function} hasPermission - must return boolean
 */
function setupRoutes(router, hasPermission) {
  const permissionRouter = express.Router();

  // assume json or text for anything in request bodies
  permissionRouter.use(jsonBodyParser);

  // check each component
  files.getFolders([appRoot, 'components'].join(path.sep)).forEach((folder) => {
    const path = ['', '_components', folder, 'instances', '*'].join('/');

    permissionRouter.put(path, checkPermission(hasPermission));
  });

  // check all pages
  permissionRouter.put('/_pages/*', checkPermission(hasPermission));

  router.use('/', permissionRouter);
}

module.exports = setupRoutes;
