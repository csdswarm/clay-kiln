'use strict';

const Media = require('./Media');

class Audio extends Media {
  constructor(el, options) {
    super(el, options);

    this.setType('audio');
  }
}

module.exports = Audio;
