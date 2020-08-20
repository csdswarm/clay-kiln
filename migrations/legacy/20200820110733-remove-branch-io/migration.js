'use strict';

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

async function getAllPagesWithBranchIOHead(db, host) {
  const query = `SELECT p.id, p.data
      FROM pages p
      WHERE data#>>'{head}' LIKE '%branch-io-head%'`,
    result = await db.query(query);

  return result.rows;
}

async function getPagesUsingBranchIO() {
  try {
    await usingDb(async db => {
      const pages = await getAllPagesWithBranchIOHead(db, host);

      pages.map(({ id, data: { head }}) => {
        const branchIOInstance = head.filter(instance => instance.includes('branch-io-head'));
      
        removeBranchIoComponents(id, branchIOInstance);
      })
    })
  } catch (error) {
    console.log('error', error);
  }
}