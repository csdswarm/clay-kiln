const { addComponentToContainers } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';

// add branch-io-head script to podcast-show page
async function addBranchHeadToPages() {
  await addComponentToContainers(
    hostUrl,
    [ '_pages/podcast-show' ],
    '_components/meta-tags/instances/general',
    'head'
  );
  await addComponentToContainers(
    hostUrl,
    [ '_pages/podcast-show' ],
    '_components/branch-io-head/instances/default',
    'head'
  );
};

addBranchHeadToPages();