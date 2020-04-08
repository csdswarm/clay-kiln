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
    SECTIONFRONT: 'section-front'
  },

  msnFeed = {
    // values are in pixels.  image requirements found here:
    // https://partnerhub.msn.com/docs/spec/vcurrent/feed-specifications/AAsCh
    image: {
      required: {
        maxSide: 4000,
        minSide: 150,
        maxSizeMb: 14,
        maxSizeB: 14e6
      },
      // we don't need all the recommended msn specs - just the important ones
      recommended: {
        ratio: {
          min: 0.5,
          max: 1.89
        }
      }
    }
  },

  DEFAULT_STATION = {
    id: 0,
    name: 'Radio.com',
    callsign: 'natl-rc',
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
  },

  DEFAULT_RADIOCOM_LOGO = 'https://images.radio.com/aiu-media/og_775x515_0.jpg',

  LOAD_MORE_LIMIT = 10;


module.exports = {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  YEAR,
  time,
  msnFeed,
  SERVER_SIDE,
  PAGE_TYPES,
  DEFAULT_RADIOCOM_LOGO,
  DEFAULT_STATION,
  LOAD_MORE_LIMIT
};
