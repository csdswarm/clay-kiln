'use strict';

const fs = require('fs'),
  path = require('path'),
  staticDirs = fs.readdirSync(path.resolve(__dirname , '../../public'), function (err, filesPath) {
    if (err) throw err;
    const result = filesPath.map(function (filePath) {
      return filePath;
    });

    return result;
  });

/**
 * Check the path for static dirs
 *
 * @param {string} path The path to check
 * @returns {boolean}
 */
function isStaticAsset(path) {
  // If this is a static asset always return false
  return staticDirs.some(dirName => path.startsWith('/' + dirName));
}

module.exports = {
  isStaticAsset
};
