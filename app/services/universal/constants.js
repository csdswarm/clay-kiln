'use strict';

// Time Constants
const SECOND = 1000,
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
  };


module.exports = {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  YEAR,
  time,
  PAGE_TYPES,
  msnFeed
};
