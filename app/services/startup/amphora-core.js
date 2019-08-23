'use strict';

const express = require('express'),
  amphora = require('amphora'),
  renderers = require('./amphora-renderers'),
  healthCheck = require('@nymdev/health-check'),
  permissionsPlugin = require('./amphora-permissions'),
  log = require('../universal/log').setup({ file: __filename }),
  { getComponentInstance } = require('../server/publish-utils'),
  { getComponentName, isPage, isPublished } = require('clayutils'),
  { loadPermissions } = require('../../services/server/urps'),
  addPermissions = require('../../services/universal/permissions');

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
      log('error', e);
    }
    next();
  });

  return userPermissionRouter;
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
  // server side checking specific components if required
  // if (isComponent(uri)) {
  //   return locals.user.can('xyz').a(getComponentName(uri)).at(locals.station.callsign);
  // }

  if (isPage(uri) && isPublished(uri)) {
    try {
      const page = await getComponentInstance(uri.split('@')[0], {}),
        pageType = getComponentName(page.main[0]);

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
