const { addComponentToContainers } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';

// add branch-io-head script and meta-tag to events pages
async function addBranchandMetaTagHeadToPages() {
  await Promise.all([
    addComponentToContainers(
      hostUrl,
      [ '_pages/event' ],
      '_components/branch-io-head/instances/default',
      'head'
    ),
    addComponentToContainers(
      hostUrl,
      [ '_pages/event' ],
      '_components/meta-tags/instances/general',
      'head'
    )
  ]);
};

addBranchandMetaTagHeadToPages()
  .catch(function (error) {
    console.log('error', error);
  });
