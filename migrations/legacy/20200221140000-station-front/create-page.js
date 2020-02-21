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
            '/_components/meta-title/instances/general',
            '/_components/meta-description/instances/general',
            '/_components/meta-image/instances/general',
            '/_components/meta-url/instances/general',
            '/_components/meta-tags/instances/general'
          ],
          main: [
            '/_components/station-front/instances/new'
          ],
          layout: '/_layouts/one-column-layout/instances/general',
          pageHeader: [
            '/_components/topic-page-header/instances/new'
          ],
          layoutHeader: [
            '/_components/google-ad-manager/instances/billboardTop'
          ]
        }
      }
    }
  });

  console.log('Finished creating Station Front page.');
}

module.exports = createNewPage;
