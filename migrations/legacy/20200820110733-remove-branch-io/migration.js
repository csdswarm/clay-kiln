'use strict';

const Promise = require('../../../app/node_modules/bluebird');

const {
  removeComponentsFromContainers,
  usingDb
} = require('../migration-utils').v1;

const { parseHost } = require('../migration-utils').v2;

const host = process.argv[2] || 'clay.radio.com',
  envInfo = parseHost(host);
  

getPagesUsingBranchIO();

// helper functions
function removeBranchIoComponents(page, branchIOInstance) {
  return removeComponentsFromContainers({
    envInfo,
    remove: {
      [page]: {
        head: branchIOInstance
      }
    }
  })
}

async function getAllArchivedPages(db, host) {
  const archivedQuery = `SELECT p.id, p.data
      FROM pages p
      WHERE (meta->>'published')::boolean IS false
      AND (meta->>'archived')::boolean IS true`,
    archivedResult = await db.query(archivedQuery);

  return archivedResult.rows
    .filter(({ id }) => (
      id.startsWith(host)
    )).map(({id}) => id.slice((host).length))
}

async function getAllPagesWithBranchIOHead(db, host) {
  const query = `SELECT p.id, p.data
      FROM pages p
      WHERE id ~ '@published$' 
      AND data->>'head' ~ 'branch-io-head'`,
    result = await db.query(query);

  return result.rows
    .filter(({ id }) => (id.startsWith(host)))
    .map((row) => Object.assign({}, row, { id: row.id.replace('@published', '') }))
    .map((row) => Object.assign({}, row, { id: row.id.slice((host).length) }))
}

async function getPagesUsingBranchIO() {
  try {
    await usingDb(async db => {
      const archivedPages = await getAllArchivedPages(db, host),
        pages = await getAllPagesWithBranchIOHead(db, host);

      return Promise.map(pages, async ({ id, data: { head } }) => {
        if (!archivedPages.includes(id)) {
          const branchIOInstance = head
            .filter(instance => instance.includes('branch-io-head'))
            .map((row) => row.replace('@published', ''))
            .map((row) => row.slice((host).length))

          return await removeBranchIoComponents(id, branchIOInstance);
        }
      }, { concurrency: 5 }
    )
    })
  } catch (error) {
    console.log('error', error);
  }
}
