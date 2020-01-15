'use strict';

const _get = require('lodash/get'),
  // Time Constants
  SECOND = 1000,
  MINUTE = 60 * SECOND,
  HOUR = 60 * MINUTE,
  DAY = 24 * HOUR,
  WEEK = 7 * DAY,
  YEAR = 365 * DAY,

  time = {
    SECOND,
    MINUTE,
    HOUR,
    DAY,
    WEEK,
    YEAR
  },

  SERVER_SIDE = _get(process, 'release.name') === 'node',

  PAGE_TYPES = {
    ARTICLE: 'article',
    AUTHOR: 'author-page-header',
    GALLERY: 'gallery',
    SECTIONFRONT: 'section-front',
    EVENT: 'event',
    EVENTSLISTING: 'events-listing-page'
  },

  // this should list the component names of the content types which may be
  //   created via the kiln drawer.
  contentTypes = new Set([
    'article',
    'gallery',
    'section-front',
    'static-page',
    'topic-page'
  ]),

  DEFAULT_RADIOCOM_LOGO = 'https://images.radio.com/aiu-media/og_775x515_0.jpg';


module.exports = {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  YEAR,
  contentTypes,
  time,
  SERVER_SIDE,
  DEFAULT_RADIOCOM_LOGO,
  PAGE_TYPES
};
