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
  stationId = {
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
  };

describe('Podcast Utils', () => {
  describe('createUrl', () => {
    it('should return an url based only with the podcast site_slug', () => {
      expect(createUrl(podcast, undefined)).to.eq(
        '/podcasts/the-morning-show-w-john-and-hugh-8'
      );
    });
    it('should return an url based on the podcast site_slug and stationId', () => {
      expect(createUrl(podcastWithStation, stationId)).to.eq(
        '/929thegame/podcasts/the-morning-show-w-john-and-hugh-8'
      );
    });
  });
});
