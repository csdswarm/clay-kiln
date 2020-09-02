'use strict';

const usingCursor = require('./using-cursor'),
  utils = require('./utils');

module.exports = {
  v1: {
    usingCursor: usingCursor.v1,
    ...utils.v1
  }
};
