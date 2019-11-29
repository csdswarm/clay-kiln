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
  // this should list the component names of the content types which may be
  //   created via the kiln drawer.
  contentTypes = new Set([
    'article',
    'gallery',
    'section-front',
    'static-page',
    'topic-page'
  ]);


module.exports = {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  YEAR,
  PAGE_TYPES,
  contentTypes,
  time
};
