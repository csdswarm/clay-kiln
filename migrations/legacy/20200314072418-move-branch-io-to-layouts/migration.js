'use strict';

const {
  addComponentToContainers,
  formatAxiosError,
  removeComponentsFromContainers,
  usingDb
} = require('../migration-utils').v1;

const { parseHost } = require('../migration-utils').v2;

const host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host);

removeBranchIoComponents()
  .then(addBranchIoToLayouts)
  .catch(err => console.error(formatAxiosError(err, { includeStack: true })))

// helper functions

function removeBranchIoComponents() {
  return removeComponentsFromContainers({
    envInfo,
    remove: {
      '/_pages/station': {
        head: ['/_components/branch-io-head/instances/default']
      }
    }
  })
}

async function getAllLayoutInstanceIdsWithoutHost(db, host) {
  const result = await db.query(`
    select id from layouts."one-column-full-width-layout"
    union
    select id from layouts."one-column-layout"
    union
    select id from layouts."two-column-layout"
  `)

  return result.rows.map(({ id }) => id)
    // there exists bad rows in the database which come from different hosts
    //   so it's easiest if we skip over them
    .filter(id => id.startsWith(host))
    // then remove the host from the beginning so it's compatible with
    //   addComponentToContainers' signature
    .map(id => id.slice((host + '/').length));
}

async function addBranchIoToLayouts() {
  await usingDb(async db => {
    const layoutIds = await getAllLayoutInstanceIdsWithoutHost(db, host);

    await addComponentToContainers(
      host,
      layoutIds,
      '_components/branch-io-head/instances/default',
      'headLayout',
      (_, data) => {
        // remove old branch-io component references
        if (Array.isArray(data.head)) {
          data.head = data.head.filter(ref => !ref.includes('/branch-io-head/'));
        }
      }
    );
  })
}
