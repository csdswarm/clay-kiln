const { addComponentToContainers } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';

// add branch-io-head script to article, gallery, and section-front pages
async function addBranchHeadToPages() {
  await addComponentToContainers(
    hostUrl,
    [ '_pages/topic' ],
    '_components/branch-io-head/instances/default',
    'head'
  );
};

addBranchHeadToPages()
  .catch(function (error) {
    console.log('error', error);
  });
