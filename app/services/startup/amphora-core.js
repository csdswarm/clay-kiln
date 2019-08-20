'use strict';

const amphora = require('amphora'),
  renderers = require('./amphora-renderers'),
  healthCheck = require('@nymdev/health-check'),
  permissions = require('./amphora-permissions'),
  log = require('../universal/log').setup({ file: __filename }),
  { getComponentInstance } = require('../server/publish-utils'),
  { getComponentName, isPage, isPublished } = require('clayutils');

/**
 * determine if the current user has permissions to the specific item
 *
 * @param {string} uri
 * @param {object} data
 * @param {object} locals
 * @return {boolean}
 */
async function hasPermissions(uri, data, locals) {
  // server side checking specific components if required
  // if (isComponent(uri)) {
  //   return locals.user.can('xyz').a(getComponentName(uri)).at(locals.station.callsign);
  // }

  if (isPage(uri) && isPublished(uri)) {
    try {
      const page = await getComponentInstance(uri.split('@')[0], {});

      return locals.user.can('publish').a(getComponentName(page.main[0])).at(locals.station.callsign).value;
    } catch (e) {
      log('error', e);
    }

    return false;
  }
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
