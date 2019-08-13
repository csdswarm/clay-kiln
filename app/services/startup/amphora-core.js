'use strict';

const amphora = require('amphora'),
  renderers = require('./amphora-renderers'),
  healthCheck = require('@nymdev/health-check'),
  permissions = require('./amphora-permissions'),
  { isPage, isPublished } = require('clayutils');

/**
 * determine if the current user has permissions to the specific item
 *
 * @param {string} uri
 * @param {object} data
 * @param {object} user
 * @return {boolean}
 */
function hasPermissions(uri, data, user) {
  // STUB for testing - if cognito users have no permissions to publish pages

  return user.provider === 'cognito' && isPage(uri) && isPublished(uri);
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
      permissions(hasPermissions)
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
