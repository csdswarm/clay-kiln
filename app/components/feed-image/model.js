'use strict';

const mimeTypes = require('mime-types'),
  msnFeedUtils = require('../../services/universal/msn-feed-utils'),
  { assignDimensionsAndFileSize } = require('../../services/universal/image-utils'),
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  // async render is fine here because is404 will only be undefined once per
  //   component
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
    data.mimeType = mimeTypes.lookup(data.url);

    return data;
  }
});
