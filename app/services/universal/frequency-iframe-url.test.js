'use strict';
const
  chai = require('chai'),
  sinonChai = require('sinon-chai'),
  frequencyIframeUrl = require('./frequency-iframe-url'),
  urlString = 'https://clay-radio.com/1010wins/shows/show-schedule',
  expectedUrl = 'https://winsam.dev-radio-drupal.com/shows/show-schedule',
  callsign = 'winsam',
  { expect } = chai;

chai.use(sinonChai);

describe('frequencyIframeUrl', () => {
  
  describe('actions', () => {
    it('get the expected frequency url', () => {
      const frequencyUrl = frequencyIframeUrl(urlString, callsign);

      expect(frequencyUrl).to.equal(expectedUrl);
    });
  });
});
