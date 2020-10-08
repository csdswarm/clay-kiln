'use strict';

const { clayImport } = require('../migration-utils').v1;

/**
 * Create required component instances
 *
 * @param {string} host - Clay host
 */
async function createComponentInstances(host) {
  console.log('Creating Station Front instances...');

  await clayImport({
    hostUrl: host,
    payload: {
      _components: {
        'station-front': {
          instances: {
            new: {
              stationCallsign: '',
              stationSlug: '',
              mainContent: []
            }
          }
        }
      }
    }
  });

  console.log('Finished creating Station Front instances.');
}

module.exports = createComponentInstances;
