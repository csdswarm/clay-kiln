'use strict';

const exists = require('lodash/identity'),
  article = opts => {
    // e.g. http://radio.com/music/eminem-drops-new-album-and-its-fire - modified re: ON-333
    return [
      opts.prefix,
      opts.stationSlug,
      opts.sectionFront,
      opts.secondarySectionFront,
      opts.slug
    ].filter(exists)
      .join('/');
  },
  date = opts => {
    // e.g. http://vulture.com/music/x.html - modified re: ON-333
    return `${opts.prefix}/${opts.sectionFront}/${opts.slug}.html`;
  },
  gallery = opts => {
    // e.g. http://radio.com/music/gallery/grammies
    return [
      opts.prefix,
      opts.stationSlug,
      opts.sectionFront,
      opts.secondarySectionFront,
      'gallery',
      opts.slug
    ].filter(exists)
      .join('/');
  },
  sectionFront = opts => {
    // e.g. http://radio.com/music
    return [
      opts.prefix,
      opts.stationSlug,
      opts.primarySectionFront,
      opts.sectionFront
    ].filter(exists)
      .join('/');
  };

module.exports = {
  article,
  date,
  gallery,
  sectionFront
};
