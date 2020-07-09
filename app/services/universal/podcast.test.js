'use strict';

const { expect } = require('chai'),
  { createUrl } = require('./podcast');

const podcast = {
    type: 'podcast',
    id: 8,
    attributes: {
      description: 'The Morning Show w/ John and Hugh',
      title: 'The Morning Show w/ John and Hugh',
      site_slug: 'the-morning-show-w-john-and-hugh-8',
      station: []
    }
  },
  podcastWithStation = {
    type: 'podcast',
    id: 8,
    attributes: {
      description: 'The Morning Show w/ John and Hugh',
      title: 'The Morning Show w/ John and Hugh',
      site_slug: 'the-morning-show-w-john-and-hugh-8',
      station: [
        {
          id: 409,
          name: '92-9 The Game',
          callsign: 'WZGCFM',
          market: {
            id: 1,
            name: 'Atlanta, GA'
          }
        }
      ]
    }
  },
  podcastWithWrongStation = {
    type: 'podcast',
    id: 8,
    attributes: {
      description: 'The Morning Show w/ John and Hugh',
      title: 'The Morning Show w/ John and Hugh',
      site_slug: 'the-morning-show-w-john-and-hugh-8',
      station: [
        {
          id: 300,
          name: 'Not Valid Station',
          callsign: 'NOTFOUND',
          market: {
            id: 1,
            name: 'DARK'
          }
        }
      ]
    }
  },
  stationIds = {
    15: {
      id: 15,
      bband: 'AM',
      callsign: 'WBBMAM',
      site_slug: 'wbbm780',
      slug: 'wbbm-newsradio-780-am-1059-fm',
      market: {
        id: 4,
        name: 'Chicago, IL',
        display_name: 'Chicago, IL'
      }
    },
    409: {
      id: 409,
      bband: 'FM',
      callsign: 'WZGCFM',
      site_slug: '929thegame',
      slug: '929-the-game',
      market: {
        id: 1,
        name: 'Atlanta, GA',
        display_name: 'Atlanta, GA'
      }
    }
  };

describe('Podcast Utils', () => {
  describe('createUrl', () => {
    it('should return an url based only with the podcast site_slug', () => {
      expect(createUrl(podcast, stationIds)).to.eq(
        '/podcasts/the-morning-show-w-john-and-hugh-8'
      );
    });
    it('should return an url based on the podcast site_slug and stationId', () => {
      expect(createUrl(podcastWithStation, stationIds)).to.eq(
        '/929thegame/podcasts/the-morning-show-w-john-and-hugh-8'
      );
    });
    it('should return an url based on the podcast site_slug when there is no valid stationId', () => {
      expect(createUrl(podcastWithWrongStation, stationIds)).to.eq(
        '/podcasts/the-morning-show-w-john-and-hugh-8'
      );
    });
  });
});
