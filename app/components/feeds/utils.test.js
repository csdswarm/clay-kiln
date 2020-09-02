'use strict';

const _identity = require('lodash/identity'),
  proxyquire = require('proxyquire'),
  { expect } = require('chai');

const utils = proxyquire('./utils', {
    './transforms': {
      'identity-identity': _identity
    }
  }),
  { rendererPipeline } = utils,
  baseData = {
    attr: {},
    meta: {},
    transform: 'identity'
  },
  identityPrefix = 'identity';

describe('utils', () => {
  describe('rendererPipeline', () => {
    it('should create a promise of the feed', async () => {
      const data = Object.assign({}, baseData, {
          results: [{ test: true }]
        }),
        locals = {},
        result = await rendererPipeline('ref', data, locals, identityPrefix);

      expect(result.meta).to.equal(data.meta);
      expect(result.attr).to.equal(data.attr);
      expect(result.feed).to.deep.equal([{
        link: undefined,
        test: true,
        utmMedium: 'f1',
        utmSource: 'nym'
      }]);
    });

    it('should localize station content when isStationFeed is true', async () => {
      const callsign = 'wrvqfm',
        data = Object.assign({}, baseData, {
          results: [{
            canonicalUrl: 'https://test-clay.radio.com/some-path',
            stationSyndication: [{
              callsign: callsign.toUpperCase(),
              syndicatedArticleSlug: '/q94/a-different-path'
            }]
          }]
        }),
        locals = { filter: {
          isStationFeed: true,
          station: callsign
        } },
        result = await rendererPipeline('ref', data, locals, identityPrefix);

      expect(result.feed).to.have.lengthOf(1);
      expect(result.feed[0]).to.include({
        link: 'https://test-clay.radio.com/q94/a-different-path'
      });
    });
  });
});
