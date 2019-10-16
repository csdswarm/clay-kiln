'use strict';

const exists = require('lodash').identity;

// URL patterns below need to be handled by the site's index.js
module.exports.dateUrlPattern = opts => {
  // e.g. http://vulture.com/music/x.html - modified re: ON-333
  return `${opts.prefix}/${opts.sectionFront}/${opts.slug}.html`;
};
module.exports.articleSlugPattern = opts => {
  // e.g. http://radio.com/music/eminem-drops-new-album-and-its-fire - modified re: ON-333
  return [
    opts.prefix,
    opts.stationSlug,
    opts.sectionFront,
    opts.secondarySectionFront,
    opts.slug
  ].filter(exists)
    .join('/');
};
module.exports.gallerySlugPattern = opts => {
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
};
module.exports.sectionFrontSlugPattern = opts => {
  // e.g. http://radio.com/music
  return [
    opts.prefix,
    opts.stationSlug,
    opts.primarySectionFront,
    opts.sectionFront
  ].filter(exists)
    .join('/');
};
module.exports.contestSlugPattern = opts => {
  // e.g. http://radio.com/contests/mix-105-1-gatorland-tickets
  return [
    opts.prefix,
    opts.stationSlug,
    'contests',
    opts.slug
  ].filter(exists)
    .join('/');
};
