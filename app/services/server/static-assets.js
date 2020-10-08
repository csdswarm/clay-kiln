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
 * Check the path for static dir and that it's a file not a path
 *
 * @param {string} filepath The path to check
 * @returns {boolean} If the filepath being checked is in the static dir and does not have an extension
 */
function isStaticAsset(filepath) {
  if (_isEmpty(_state.staticDirs)) {
    setStaticDirs();
  }

  // If this is a static asset return true
  return _state.staticDirs.some(dirName => filepath.startsWith('/' + dirName)) && path.extname(filepath) !== '';
}

module.exports = {
  isStaticAsset
};
