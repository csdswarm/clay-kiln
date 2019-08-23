'use strict';

const Media = require('./Media');

class Audio extends Media {
  /**
   * @override
   *
   */
  constructor(el, options) {
    super(el, options);
  }
}

module.exports = Audio;
