'use strict';

const exists = require('lodash/identity'),
  // URL patterns below need to be handled by the site's index.js
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
  contestSlugPattern = opts => {
    // e.g. http://radio.com/contests/mix-105-1-gatorland-tickets
    return [
      opts.prefix,
      opts.stationSlug,
      'contests',
      opts.slug
    ].filter(exists)
      .join('/');
  },
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
  contest = opts => {
    // e.g. http://radio.com/contests/mix-105-1-gatorland-tickets
    return [
      opts.prefix,
      opts.stationSlug,
      'contests',
      opts.slug
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
  },
  staticPage = opts => {
    return [
      opts.prefix,
      opts.stationSlug,
      opts.slug
    ].filter(exists)
      .join('/');
  },
  host = opts => {
    return [
      opts.prefix,
      opts.stationSlug,
      opts.contentType,
      opts.hostSlug
    ].filter(exists)
      .join('/');
  },
  podcastFront = opts => {
    // e.g. http://radio.com/podcasts or http://radio.com/kroq/podcasts
    return [
      opts.prefix,
      opts.stationSlug,
      'podcasts'
    ].filter(exists)
      .join('/');
  };

module.exports = {
  article,
  author,
  contestSlugPattern,
  date,
  gallery,
  host,
  sectionFront,
  event,
  eventsListing,
  contest,
  stationFront,
  staticPage,
  podcastFront
};
