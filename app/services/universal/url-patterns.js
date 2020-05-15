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
  author = opts => {
    return [
      opts.prefix,
      opts.stationSlug,
      opts.contentType,
      opts.authorSlug
    ].filter(exists)
      .join('/');
  },
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
  event = opts => {
    // e.g. http://radio.com/events/mix-105-rock-n-jock
    return [
      opts.prefix,
      opts.stationSlug,
      'events',
      opts.slug
    ].filter(exists)
      .join('/');
  },
  eventsListing = opts => {
    /* e.g.
      http://radio.com/events
      http://radio.com/kroq/events
    */
    return [
      opts.prefix,
      opts.stationSlug,
      'events'
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
  event,
  eventsListing,
  stationFront
};
