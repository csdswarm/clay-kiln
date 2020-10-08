'use strict';

const { clayImport } = require('../migration-utils').v1;

/**
 * Create new "station-front" page
 *
 * @param {string} host - Clay host
 */
async function createNewPage(host) {
  console.log('Creating Station Front page...');

  await clayImport({
    hostUrl: host,
    payload: {
      _pages: {
        'station-front': {
          head: [
            '/_components/meta-title/instances/station-basic-music',
            '/_components/meta-description/instances/station-basic-music',
            '/_components/meta-url/instances/station-basic-music',
            '/_components/meta-tags/instances/general'
          ],
          main: [
            '/_components/station-front/instances/new'
          ],
          layout: '/_layouts/one-column-layout/instances/station-basic-music',
          secondary: [],
          pageHeader: [],
          topSection: [
            '/_components/station-nav/instances/new'
          ],
          layoutHeader: [
            '/_components/google-ad-manager/instances/billboardTop'
          ],
          bottomSection: [
            '/_components/station-footer/instances/new'
          ]
        }
      }
    }
  });

  console.log('Finished creating Station Front page.');
}

module.exports = createNewPage;
