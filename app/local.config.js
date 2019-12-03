'use strict';

module.exports = {
  apps : [{
    name: 'app',
    script: './app.js',
    watch: [
      'app.js',
      'components',
      'global/kiln-js',
      'search',
      'services',
      'sites',
      'public',
      'routes',
      'layouts'
    ],
    ignore_watch: [
      '**/*.test.js',
      'components/**/client.js'
    ],
    watch_delay: 3000,
    env: {
      NODE_ENV: 'local'
    },
    max_memory_restart: '256M'
  }]
};
