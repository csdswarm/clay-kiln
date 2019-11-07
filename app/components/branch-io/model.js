'use strict';

const branchIoKey = process.env.BRANCH_IO_KEY,
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  render: function (ref, data) {
    data._computed = {
      branchIoKey
    };

    return data;
  }
});
