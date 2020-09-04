'use strict';

const revertIndex = require('./revert-index'),
  updateIndex = require('./update-index');

module.exports = {
  v1: {
    revertIndex: revertIndex.v1,
    updateIndex: updateIndex.v1
  },
  v2: {
    updateIndex: updateIndex.v2
  }
};
