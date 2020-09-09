'use strict';

const _identity = require('lodash/identity'),
  chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  proxyquire = require('proxyquire');

chai.use(chaiAsPromised);

const { expect } = chai,
  rendererPipeline = proxyquire('./renderer-pipeline', {
    './transforms': {
      'identity-identity': _identity
    }
  }),
  baseData = {
    attr: {},
    meta: {},
    transform: 'identity'
  },
  callsign = 'wrvqfm',
  identityPrefix = 'identity';

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

  it('should localize station content', async () => {
    const data = getStationData();

    // first make sure filter.isStationFeed is supported
    let locals = {
        filter: {
          isStationFeed: 'true',
          station: callsign
        }
      },
      result = await rendererPipeline('ref', data, locals, identityPrefix);

    expect(result.feed).to.have.lengthOf(1);
    expect(result.feed[0]).to.include({
      link: 'https://test-clay.radio.com/q94/a-different-path'
    });

    // then make sure locals.isStationFeed is supported
    locals = {
      filter: { station: callsign },
      isStationFeed: 'true'
    };
    result = await rendererPipeline('ref', data, locals, identityPrefix);

    expect(result.feed).to.have.lengthOf(1);
    expect(result.feed[0]).to.include({
      link: 'https://test-clay.radio.com/q94/a-different-path'
    });

    // and andFilter.station
    locals = {
      andFilter: { station: callsign },
      isStationFeed: 'true'
    };
    result = await rendererPipeline('ref', data, locals, identityPrefix);

    expect(result.feed).to.have.lengthOf(1);
    expect(result.feed[0]).to.include({
      link: 'https://test-clay.radio.com/q94/a-different-path'
    });
  });

  it('should throw when improper params are passed', async () => {
    const data = getStationData();

    // first make sure filter.isStationFeed is supported
    let locals = { isStationFeed: 'true' };

    await expect(rendererPipeline('ref', data, locals, identityPrefix))
      .to.be.rejectedWith('station feeds require andFilter.station');

    locals = {
      isStationFeed: 'true',
      orFilter: { station: callsign }
    };

    await expect(rendererPipeline('ref', data, locals, identityPrefix))
      .to.be.rejectedWith('you cannot declare orFilter.station');

    locals = {
      andFilter: { station: callsign },
      isStationFeed: 'true',
      filter: { station: 'some other callsign' }
    };

    await expect(rendererPipeline('ref', data, locals, identityPrefix))
      .to.be.rejectedWith('you cannot declare multiple station filters');

    locals = {
      andFilter: { station: [callsign, 'some other callsign'] },
      isStationFeed: 'true'
    };

    await expect(rendererPipeline('ref', data, locals, identityPrefix))
      .to.be.rejectedWith('you cannot declare multiple station filters');
  });
});

function getStationData() {
  return Object.assign({}, baseData, {
    results: [{
      canonicalUrl: 'https://test-clay.radio.com/some-path',
      stationSyndication: [{
        callsign: callsign.toUpperCase(),
        syndicatedArticleSlug: '/q94/a-different-path'
      }]
    }]
  });
}
