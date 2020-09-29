'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { handleDefault } = require('../../services/kiln/plugins/default-text-with-override/on-model-save');

module.exports = unityComponent({
  save: (uri, data, locals) => {
    // If data.description is an empty string or undefined, and locals.newPageStation exists
    // we are creating a new station page and should set the values for the intial meta data
    const populateDescription = (
      data.defaultDescription === ''
      || data.defaultDescription === undefined
    ) && locals.newPageStation;

    if (populateDescription) {
      data.defaultDescription = locals.newPageStation.description;
    };

    handleDefault('description', 'defaultDescription', data);

    return data;
  }
});
