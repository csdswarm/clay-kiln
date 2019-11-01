'use strict';
const fs = require('fs');

/**
 *
 * @param {Object} params
 * @returns {Promise<any>}
 */
function readFile_v1(params) {
  const { path } = params;
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (error, data) => {
      error
        ? reject({ result: 'fail', params, error })
        : resolve({ result: 'success', data, params });
    });
  });
}

module.exports = { v1: readFile_v1 };
