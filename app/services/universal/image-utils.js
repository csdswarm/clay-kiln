'use strict';

const getImageinfo = require('../server/get-image-info'),
  /**
   * if the url exists, then we fetch the image's file size and dimensions and
   *   assign those values to data.
   *
   * @param {string} uri
   * @param {object} data
   */
  assignDimensionsAndFileSize = async (uri, data) => {
    const { url } = data;

    if (!url) {
      return;
    }

    const result = await getImageinfo(url);

    if (result.is404) {
      data.is404 = true;
    } else {
      delete data.is404;

      Object.assign(data, {
        sizeInBytes: result.fileSizeInBytes,
        ...result.dimensions
      });
    }
  };

module.exports = { assignDimensionsAndFileSize };
