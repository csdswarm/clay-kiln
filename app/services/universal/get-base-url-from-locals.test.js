'use strict';
const
  chai = require('chai'),
  { expect } = chai,
  sinonChai = require('sinon-chai'),
  getBaseUrlFromLocals = require('./get-base-url-from-locals'),
  expectedUrl = 'https://this-is-a-test-url.com',
  locals = {
    url: 'http://this-is-a-test-url.com'
  };

chai.use(sinonChai);

describe('getBaseUrlFromLocals', () => {
  
  describe('actions', () => {
    it('get base url from locals', () => {
      const baseUrl = getBaseUrlFromLocals(locals);
      
      expect(baseUrl).to.equal(expectedUrl);
    });

    it('should remove query params from url', () => {
      locals.url = 'http://this-is-a-test-url.com?query=true';

      const baseUrl = getBaseUrlFromLocals(locals);
      
      expect(baseUrl).to.equal(expectedUrl);
    });
  });
});
