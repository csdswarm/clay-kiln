'use strict';

const _pick = require('lodash/pick'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  fetchMock = require('fetch-mock'),
  { jsdom } = require('jsdom'),
  { expect } = chai,
  dom = new jsdom(),
  domGlobals = ['atob', 'document', 'DOMParser', 'window'],
  oldGlobals = _pick(global, domGlobals),
  getRadioApi = () => require('./radioApi');

chai.use(sinonChai);

describe('radioApi', () => {
  before(() => {
    Object.assign(global, _pick(dom.defaultView, domGlobals));
  });

  after(() => {
    Object.assign(global, oldGlobals);
  });

  afterEach(sinon.restore);

  function setup_radioApi() {
    const { fetchDOM, _internals: __ } = getRadioApi();

    sinon.stub(__.clientStateInterface, 'getState').resolves([{}]);
    sinon.stub(__, 'spaInterface').returnsArg(0);

    return fetchDOM;
  }

  describe('fetchDOM', () => {
    afterEach(fetchMock.restore);

    it('can bypass cache', async () => {
      const fetchDOM = setup_radioApi();

      fetchMock.mock('*', '');

      await fetchDOM('/someComponent.html', { bypassCache: true });

      expect(fetchMock.lastUrl()).to.include('&random');
    });
  });
});
