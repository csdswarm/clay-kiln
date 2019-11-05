'use strict';
const fs = require('fs');
const util = require('util');
const readFileAsync_v1 = util.promisify(fs.readFile);
const getFileText_v1 = path => readFileAsync_v1(path, 'utf-8');

/**
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

module.exports = {
  v1: {
    /**
     * use readFileAsync instead, keeping readFile only for backwards compatibility
     * @deprecated
     */
    readFile: readFile_v1,
    getFileText: getFileText_v1,
    readFileAsync: readFileAsync_v1,
  }
};
