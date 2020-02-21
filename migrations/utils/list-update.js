'use strict';

const clayImport = require('./clay-import').v1;

/**
 * Updates or creates the data in a list.
 *
 * @param {string} host - The Clay host
 * @param {string} list - The name of the list to create or update
 * @param {any[]} data - The new data of the list
 * @returns Promise<any>
 */
async function updateList_v1(host, list, data) {
  const response = await clayImport({
    hostUrl: host,
    payload: {
      _lists: {
        [list]: data
      }
    }
  });

  if (response.result !== 'success') {
    throw new Error(`Unable to create or update list "${list}"`);
  }
}

module.exports = {
  v1: updateList_v1
};
