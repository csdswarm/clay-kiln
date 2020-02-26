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
              includePodcastModule: false,
              sectionLead: {
                _ref: '/_components/section-lead/instances/new'
              },
              googleAdUnderStationsModule: {
                _ref: '/_components/google-ad-manager/instances/billboardBottom'
              },
              podcastList: {
                _ref: '/_components/podcast-list/instances/new'
              },
              twoColumnComponent: {
                _ref: '/_components/two-column-component/instances/section-front'
              },
              stationsCarousel: []
            }
          }
        }
      }
    }
  });

  console.log('Finished creating Station Front instances.');
}

module.exports = createComponentInstances;
