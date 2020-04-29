'use strict';

// we want a single log file so errors and info aren't displayed separately
const logOutput = '~/.pm2/logs/app_name-out.log';

module.exports = {
  apps : [{
    name: 'app',
    script: './app.js',
    output: logOutput,
    error: logOutput,
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
