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
  author = opts => `${opts.prefix}/${opts.contentType}/${opts.authorSlug}`,
  // e.g. http://vulture.com/music/x.html - modified re: ON-333
  date = opts => `${opts.prefix}/${opts.sectionFront}/${opts.slug}.html`,
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
  },
  stationFront = opts => {
    // e.g. http://radio.com/weei
    return [
      opts.prefix,
      opts.stationSlug
    ].filter(exists)
      .join('/');
  };

module.exports = {
  article,
  author,
  date,
  gallery,
  sectionFront,
  stationFront
};
