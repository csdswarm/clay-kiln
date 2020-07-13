'use strict';
const
  chai = require('chai'),
  sinonChai = require('sinon-chai'),
  frequencyIframeUrl = require('./frequency-iframe-url'),
  urlString = 'https://clay.radio.com/kroq/shows/show-schedule',
  expectedUrl = 'https://kroqfm.dev-radio-drupal.com/shows/show-schedule?theme=radiocom',
  callsign = 'KROQFM',
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
