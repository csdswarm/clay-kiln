'use strict';

const _noop = require('lodash/noop'),
  _set = require('lodash/set'),
  proxyquire = require('proxyquire').noCallThru(),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  chai = require('chai'),
  { topicPagePrefixes } = require('../universal/constants');

chai.use(sinonChai);

const canonicalJson = proxyquire('./canonical-json', {
    amphora: {
      composer: { composePage: _noop },
      sites: { sites: () => [] }
    },
    '../server/db': {
      get: async uri => {
        return uri.endsWith('/_lists/primary-section-fronts')
          ? []
          : {};
      },
      getUri: uri => {
        return uri.includes('/_uris/')
          ? Promise.reject(new Error('Key not found in database'))
          : Promise.resolve('');
      },
      uriToUrl: () => ''
    },
    '../universal/log': {
      setup: () => _noop
    }
  }),
  mock = {},
  { expect } = chai;

describe('canonical-json', () => {
  it('should not 404 with national topic prefixes', () => {
    const tests = topicPagePrefixes.map(async prefix => {
      mock.request = getMockRequest();
      mock.response = getMockResponse();

      const path = `/${prefix}/some-topic`;

      Object.assign(mock.request, {
        path,
        url: `https://clay.radio.com${path}`
      });

      await canonicalJson(mock.request, mock.response);

      expect(mock.response.json).to.have.been.calledOnce;
      expect(mock.response.json).to.have.been.calledWith(undefined);
    });

    return Promise.all(tests);
  });

  it('should not 404 with station topic prefixes', () => {
    const tests = topicPagePrefixes.map(async prefix => {
      mock.request = getMockRequest();
      mock.response = getMockResponse();

      _set(mock.response.locals, 'station.site_slug', 'some-slug');

      const path = `/some-slug/${prefix}/some-topic`;

      Object.assign(mock.request, {
        path,
        url: `https://clay.radio.com${path}`
      });

      await canonicalJson(mock.request, mock.response);

      expect(mock.response.json).to.have.been.calledOnce;
      expect(mock.response.json).to.have.been.calledWith(undefined);
    });

    return Promise.all(tests);
  });
});

function getMockRequest() {
  return {
    headers: { 'x-amphora-page-json': 'true' },
    hostname: 'clay.radio.com',
    method: 'GET'
  };
}

function getMockResponse() {
  const res = {
    locals: {},
    json: sinon.spy(),
    status: () => res
  };

  return res;
}
