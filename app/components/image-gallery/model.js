'use strict';

module.exports.save = (uri, data) => {
  data.galleryLength = data.images ? data.images.length : 0;

  return data;
};
