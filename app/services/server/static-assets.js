'use strict';

const _isEmpty = require('lodash/isEmpty'),
  _state = {
    staticDirs: []
  },
  { readdirSync } = require('fs'),
  path = require('path'),
  /**
   * Set the list of static dirs onto state so all subsequent calls skip the load logic
   */
  setStaticDirs = () => {
    _state.staticDirs = readdirSync(path.resolve(__dirname , '../../public'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  };

/**
 * Check the path for static dirs
 *
 * @param {string} path The path to check
 * @returns {boolean}
 */
function isStaticAsset(filepath) {
  if (_isEmpty(_state.staticDirs)) {
    setStaticDirs();
  }

  // If this is a static asset always return false
  return _state.staticDirs.some(dirName => filepath.startsWith('/' + dirName));
}

module.exports = {
  isStaticAsset
};
