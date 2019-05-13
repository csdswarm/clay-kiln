'use strict';

const Media = require('./Media');

class Audio extends Media {
  constructor(el, options) {
    const audioOptions = { type: 'Audio' },
      superOptions =  options ? { ...options, ...audioOptions } : audioOptions;

    super(el, superOptions);
  }
}

module.exports = Audio;
