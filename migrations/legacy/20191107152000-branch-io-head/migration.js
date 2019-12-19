const { addComponentToContainers, readFile, clayImport, prettyJSON } = require('../migration-utils').v1;
const hostUrl = process.argv[2] || 'clay.radio.com';

async function createBranchIoHead() {
  try {
    const { data } = await readFile({ path: './_components.yml' });
    await clayImport({ payload: data, hostUrl });
  } catch (error) {
    console.log('An error occurred while trying to create the default branch-io-head instance.', prettyJSON({ error }));
    throw error;
  }
}

createBranchIoHead()
  .then(() => {
    // add branch-io-head script to station page and remove old refs
    addComponentToContainers(hostUrl, [
      '_pages/station'
    ], '_components/branch-io-head/instances/default', 'head', (_, data) => {
      // remove old branch-io component references
      if (Array.isArray(data.head)) {
        data.head = data.head.filter(ref => !ref.includes('/branch-io/'));
      }
    });
  });
