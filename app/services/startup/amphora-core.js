'use strict';

const amphora = require('amphora'),
  renderers = require('./amphora-renderers'),
  healthCheck = require('@nymdev/health-check'),
  permissionsPlugin = require('./amphora-permissions'),
  { checkUserPermissions, userPermissionRouter } = require('../server/permissions');

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
