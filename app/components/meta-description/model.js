'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { handleDefault } = require('../../services/kiln/plugins/default-text-with-override/on-model-save');

module.exports = unityComponent({
  save: (uri, data) => {
    handleDefault('description', 'defaultDescription', data);

    return data;
  }
});
