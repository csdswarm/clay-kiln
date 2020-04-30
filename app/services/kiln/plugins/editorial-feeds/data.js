'use strict';
/**
 * This file is intended to mock data comming from the API.
 */

const columnTitles = [
  'Trending',
  'AC',
  'Adult Hits',
  'Alternative',
  'CHR / Top 40',
  'Classic Hits',
  'Classic Rock',
  'Country',
  'Hip Hop',
  'Hot AC',
  'Hot AC / Top 40 / CHR',
  'News/Talk',
  'R and B',
  'Rock',
  'Sports',
  'Throwbacks',
  'Urban'
];

function create_UUID() {
  var dt = new Date().getTime(),
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;

      dt = Math.floor(dt / 16);
      return (c == 'x' ? r : r & 0x3 | 0x8).toString(16);
    });

  return uuid;
}

const editorials = [
    {
      id: create_UUID(),
      callsign: 'WJZ-AM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': false,
        Sports: true,
        Country: false,
        'Hot AC / Top 40 / CHR': false
      }
    },
    {
      id: create_UUID(),
      callsign: 'WJZ-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': false,
        Sports: true,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: false,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': false
      }
    },
    {
      id: create_UUID(),
      callsign: 'WAAF-FM',
      feeds: {
        AC: false,
        Rock: true,
        Urban: false,
        'Hot AC': false,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: false,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': false
      }
    },
    {
      id: create_UUID(),
      callsign: 'WMJX-FM',
      feeds: {
        AC: true,
        Rock: true,
        Urban: false,
        'Hot AC': false,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': false
      }
    },
    {
      id: create_UUID(),
      callsign: 'WEEI-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': false,
        Sports: true,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: false,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': false
      }
    },
    {
      id: create_UUID(),
      callsign: 'WEEI-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': false,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: false,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': false
      }
    },
    {
      id: create_UUID(),
      callsign: 'WODS-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': false,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': true,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    },
    {
      id: create_UUID(),
      callsign: 'WWBX-FM',
      feeds: {
        AC: false,
        Rock: false,
        Urban: false,
        'Hot AC': true,
        Sports: false,
        Country: false,
        'Hip Hop': false,
        'R and B': false,
        Trending: true,
        'News/Talk': false,
        'Adult Hits': false,
        'CHR / Top 40': false,
        Throwbacks: false,
        Alternative: false,
        'Classic Hits': false,
        'Classic Rock': false,
        'Hot AC / Top 40 / CHR': true
      }
    }
  ],
  newStationFeed = () => ({
    id: create_UUID(),
    callsign : '',
    feeds: {
      AC: false,
      Rock: false,
      Urban: false,
      'Hot AC': false,
      Sports: false,
      Country: false,
      'Hip Hop': false,
      'R and B': false,
      Trending: false,
      'News/Talk': false,
      'Adult Hits': false,
      'CHR / Top 40': false,
      Throwbacks: false,
      Alternative: false,
      'Classic Hits': false,
      'Classic Rock': false,
      'Hot AC / Top 40 / CHR': false
    },
    market: '',
    rdc_domain: '',
    call_letters: ''
  });

module.exports = { editorials, newStationFeed, columnTitles };
