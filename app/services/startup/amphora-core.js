'use strict';

const amphora = require('amphora'),
  renderers = require('./amphora-renderers'),
  healthCheck = require('@nymdev/health-check'),
  eventBusService = require('../../services/universal/eventBus'),
  redis = require('redis'),
  SUBSCRIBER = redis.createClient(process.env.CLAY_BUS_HOST),
  CLAY_TOPICS = [
    'publishLayout',
    'publishPage',
    'unpublishPage',
    'createPage',
    'schedulePage',
    'unschedulePage',
    'save',
    'delete'
  ];

function initAmphora(app, search, sessionStore, routes) {
  CLAY_TOPICS.forEach(topic => {
    SUBSCRIBER.subscribe(`clay:${topic}`);
  });

  SUBSCRIBER.on('message', (channel, payload) => {
    eventBusService.triggerCallback(channel, payload);
  });
  
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
