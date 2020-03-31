'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  { assignDimensionsAndFileSize } = require('../../services/universal/image-utils'),
  msnFeedUtils = require('../../services/universal/msn-feed-utils');

module.exports = unityComponent({
  render: (uri, data, locals) => {
    const show404Message = locals.edit && data.is404;

    data._computed = Object.assign(
      { show404Message },
      msnFeedUtils.getComputedImageProps(data, locals)
    );

    return data;
  },

  save: async (uri, data) => {
    await assignDimensionsAndFileSize(uri, data);

    return data;
  }
});
