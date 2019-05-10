'use strict';

const Media = require('./Media');

class Video extends Media {
  constructor(el, options) {
    super(el, options);

    this.setType('video');
  }
}

module.exports = Video;
