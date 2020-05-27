'use strict';

const _get = require('lodash/get'),
  { getStationDomainName } = require('./urps'),
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

  STATION_LISTS = {
    'primary-section-fronts': true,
    'secondary-section-fronts': true
  },

  PAGE_TYPES = {
    ARTICLE: 'article',
    AUTHOR: 'author-page-header',
    GALLERY: 'gallery',
    SECTIONFRONT: 'section-front',
    STATIONFRONT: 'station-front'
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

  // this should list the component names of the content types which may appear
  //   under the 'main' property of a page.  Usually you can think of this as
  //   a list of page types able to be created in the kiln drawer with the
  //   addition of 'homepage'
  contentTypes = new Set([
    'article',
    'author-page',
    'gallery',
    'homepage',
    'section-front',
    'static-page',
    'topic-page',
    'latest-videos'
  ]),

  DEFAULT_RADIOCOM_LOGO = 'https://images.radio.com/aiu-media/og_775x515_0.jpg',

  defaultStationName = 'Radio.com',

  DEFAULT_STATION = {
    id: 0,
    name: defaultStationName,
    callsign: 'NATL-RC',
    website: 'https://www.radio.com',
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
    category: '',

    // the national station doesn't have a slug in the sense that national
    //   content is not stored underneath a slug like station content is.  For
    //   example national content will be at www.radio.com/my-article whereas
    //   station content will be at www.radio.com/<station slug>/my-article.
    //
    // the DEFAULT_STATION has a slug of 'www' because (I think?) it
    //   represented the subdomain e.g. www.radio.com whereas stations are
    //   located at <station subdomain>.radio.com.  I still don't know why it
    //   would be given the property name 'slug' in this case, but regardless
    //   it's something that could probably be removed/cleaned up as I don't
    //   believe the www is used anywhere
    slug: 'www',
    site_slug: ''
  };

DEFAULT_STATION.urpsDomainName = getStationDomainName(DEFAULT_STATION);

module.exports = {
  contentTypes,
  DAY,
  DEFAULT_RADIOCOM_LOGO,
  DEFAULT_STATION,
  HOUR,
  MINUTE,
  msnFeed,
  PAGE_TYPES,
  SECOND,
  SERVER_SIDE,
  STATION_LISTS,
  time,
  WEEK,
  YEAR
};
