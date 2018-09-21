'use strict';

const amphora = require('amphora'),
  renderers = require('./amphora-renderers'),
  healthCheck = require('@nymdev/health-check');

function initAmphora(app, search, sessionStore) {
  return amphora({
    app,
    renderers,
    providers: ['apikey', 'google'],
    sessionStore,
    plugins: [
      search
    ],
    cacheControl: {}
  }).then(router => {
    amphora.schedule.startListening();

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
