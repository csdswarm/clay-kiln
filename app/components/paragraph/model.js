'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  stripEot = require('../../services/universal/strip-eot');

module.exports = unityComponent({
  save: (uri, data) => {
    return {
      ...data,
      text: stripEot(data.text)
    };
  }
});
