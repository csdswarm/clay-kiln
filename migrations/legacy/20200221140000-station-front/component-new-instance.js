'use strict';

const { clayImport } = require('../migration-utils').v1;

/**
 * Create "new" instance for "station-front" component
 *
 * @param {string} host - Clay host
 */
async function createNewComponentInstance(host) {
  console.log('Creating Station Front "new" instance...');

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
                _ref: '/_components/section-lead'
              },
              googleAdUnderStationsModule: {
                _ref: '/_components/google-ad-manager/instances/leaderboardBottom'
              },
              podcastList: {
                _ref: '/_components/podcast-list/instances/new'
              },
              twoColumnComponent: {
                _ref: '/_components/two-column-component/instances/section-front'
              },
              stationsCarousel: [
                {
                  _ref: '/_components/stations-carousel/instances/section-front'
                }
              ]
            }
          }
        }
      }
    }
  });

  console.log('Finished creating Station Front "new" instance.');
}

module.exports = createNewComponentInstance;
