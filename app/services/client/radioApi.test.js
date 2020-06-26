'use strict';

const { fetchDOM, _internals: __ } = require('./radioApi'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  fetchMock = require('fetch-mock'),
  { jsdom } = require('jsdom'),
  { expect } = chai,
  dom = new jsdom();

chai.use(sinonChai);

global.document = dom.defaultView.document;
global.DOMParser = dom.defaultView.DOMParser;

describe('radioApi', () => {
  afterEach(sinon.restore);

  function setup_radioApi() {
    sinon.stub(__.clientStateInterface, 'getState').resolves([{}]);
    sinon.stub(__.clientStateInterface, 'setLoadedIds');
    sinon.stub(__, 'spaInterface').returnsArg(0);
  }

  describe('fetchDOM', () => {
    afterEach(fetchMock.restore);

    it('can bypass cache', async () => {
      setup_radioApi();

      fetchMock.mock('*', '');

      await fetchDOM('/someComponent.html', { bypassCache: true });

      expect(fetchMock.lastUrl()).to.include('&random');
    });
  });
});
