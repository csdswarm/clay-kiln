'use strict';

// see comment in commit message for why so much is included in this mock locals

module.exports = {
  ENTERCOM_DOMAINS: [
    '1thingus.com',
    'entercom.com',
    'culinarykitchenchicago.com',
    'dfwrestaurantweek.com',
    'musictowndetroit.com',
    'mensroomlive.com',
    'jimrome.com',
    'radio.com'
  ],
  station: {},
  stationForPermissions: {},
  defaultStation: {
    id: 0,
    name: 'Radio.com',
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
    slug: 'www',
    site_slug: '',
    urpsDomainName: 'National',
    national_doubleclick_bannertag: 'NTL.RADIO'
  },
  user: {
    auth: 'admin',
    name: 'Phil Olson',
    provider: 'google',
    username: 'phil.olson@swarmsolutions.com'
  },
  url: 'https://clay.radio.com/_components/feeds/instances/frequency.freq',
  site: {
    name: 'Clay Demo',
    host: 'clay.radio.com',
    path: '',
    assetDir: 'public',
    assetPath: '',
    port: 443,
    protocol: 'https',
    shortKey: 'cd',
    webPlayerHost: 'https://assets.radio.com/webplayer',
    brightcoveAccountId: 5757251889001,
    brightcovePlayerId: '9klBjvbUGf',
    brightcoveLivePlayerId: 'jTYbBkfzD',
    googleContainerId: '5XL9KZ5',
    verizonMediaCompanyId: '5b4617f33a85ab2357ed40fb',
    verizonMediaPlayerId: '5b4617f3e880db42b536cecc',
    radiocomDefaultImg: 'https://images.radio.com/aiu-media/og_775x515_0.jpg',
    sharethroughPlacementKey: 'mxkcXkpf326JUS8ZHS35e6U5',
    apsPubId: '3728',
    apsBidTimeout: 1000,
    apsLoadTimeout: 2500,
    slug: 'demo',
    dir: '/usr/src/app/sites/demo',
    prefix: 'clay.radio.com',
    providers: ['google', 'cognito'],
    resolvePublishUrl: [null, null, null, null, null, null, null, null],
    modifyPublishedData: [null]
  },
  params: {
    name: 'feeds',
    id: 'frequency',
    ext: 'freq'
  },
  query: {},
  extension: 'freq'
};
