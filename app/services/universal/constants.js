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

  DEFAULT_RADIOCOM_LOGO = 'https://images.radio.com/aiu-media/og_775x515_0.jpg';


module.exports = {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  YEAR,
  time,
  SERVER_SIDE,
  PAGE_TYPES,
  DEFAULT_RADIOCOM_LOGO
};
