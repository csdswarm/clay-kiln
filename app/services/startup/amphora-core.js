'use strict';

const amphora = require('amphora'),
  renderers = require('./amphora-renderers'),
  healthCheck = require('@nymdev/health-check'),
  feedComponents = require('./feed-components');

function initAmphora(app, search, sessionStore, routes) {
  return amphora({
    app,
    renderers,
    providers: ['apikey', 'google'],
    sessionStore,
    plugins: [
      search,
      routes
    ],
    cacheControl: {}
  }).then(router => {
    amphora.schedule.startListening();
    feedComponents.init();

    router.use(healthCheck({
      env: [
        'AMBROSE_HOST',
        'REDIS_HOST',
        'ELASTIC_HOST',
        'MASTERMIND'
      ],
      stats: {
        searchExists: function () {
          return search.getInstance().ping();
        }
      },
      required: [
        'searchExists',
        'REDIS_HOST',
        'ELASTIC_HOST'
      ]
    }));

    return router;
  });
}

module.exports = initAmphora;
