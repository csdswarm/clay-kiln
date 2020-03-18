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
    .filter(id => (
      // there exists bad rows in the database which come from different hosts
      //   so it's easiest if we skip over them
      id.startsWith(host)
      // we don't want the default instance because that causes an error on
      //   publish.  We will rely on bootstrap.yml updating it.
      && id.includes('/instances/')
      // and finally we can exclude published instances since the latest
      //   instances will get published
      && !id.endsWith('@published')
    ))
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
      'headLayout'
    );
  })
}
