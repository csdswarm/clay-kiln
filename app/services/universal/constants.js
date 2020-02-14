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
    EVENT: 'event'
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

  DEFAULT_RADIOCOM_LOGO = 'https://images.radio.com/aiu-media/og_775x515_0.jpg',

  // Default 'station' NATL-RC
  DEFAULT_STATION = {
    id: 0,
    name: 'Radio.com',
    callsign: 'NATL-RC',
    website: 'https://www.radio.com',
    slug: 'www',
    square_logo_small: 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
    square_logo_large: 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
    city: 'New York',
    state: 'NY',
    country: 'US',
    gmt_offset: -5,
    market: {
      id: 15,
      name: 'New York, NY'
    },
    category: ''
  };


module.exports = {
  DEFAULT_STATION,
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
