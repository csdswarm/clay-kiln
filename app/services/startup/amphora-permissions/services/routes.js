'use strict';


const appRoot = require('app-root-path'),
  express = require('express'),
  files = require('amphora-fs'),
  path = require('path'),
  bodyParser = require('body-parser'),
  jsonBodyParser = bodyParser.json({ strict: true, type: 'application/json', limit: '50mb' });

/**
 * intercepts and passes the permission object to the function
 *
 * @param {Function} hasPermission
 * @return {Function}
 */
function checkPermission(hasPermission) {
  return (req, res, next) => {
    if (hasPermission(req.uri, req.body, req.user || {})) {
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
