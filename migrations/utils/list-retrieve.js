'use strict';

const clayExport = require('./clay-export').v1;
const { _get } = require('./base');

/**
 * Retrieves the data of a list.
 *
 * @param {string} host - The Clay host
 * @param {string} list - The name of the list to retrieve
 * @returns Promise<any>
 */
async function retrieveList_v1(host, list) {
  const response = await clayExport({ componentUrl: `${host}/_lists/${list}` });

  if (response.result === 'success') {
    return _get(response, ['data', '_lists', list]);
  } else {
    throw new Error(`Unable to retrieve list "${list}"`);
  }
}

module.exports = {
  v1: retrieveList_v1
};
