'use strict';

const _identity = require('lodash/identity'),
  _noop = require('lodash/noop'),
  proxyquire = require('proxyquire').noCallThru(),
  { expect } = require('chai');

const mockThemingApi = {
    success: { get: () => Promise.resolve({ primaryColor: 'station-color' }) },
    error: { get: () => Promise.reject(new Error('error getting theme')) }
  },
  getModel = ({ stationThemingApi = mockThemingApi.success } = {}) => {
    return proxyquire('./model.js', {
      '../../services/universal/log': { setup: () => _noop },
      '../../services/server/stationThemingApi': stationThemingApi,
      '../../services/universal/create-content': { assignStationInfo: _noop },
      '../../services/universal/amphora': { unityComponent: _identity },
      '../theme/model': { defaultTheme: { primaryColor: 'default primary color' } }
    });
  };

describe('section-front > model', () => {
  it("it should set the primary color to the station's theme", async () => {
    const data = getMockData(),
      locals = getMockLocals(),
      { render } = getModel();

    await render('', data, locals);

    expect(data._computed.primaryColor).to.equal('station-color');
  });

  it("it should set the primary color to the default if the station's theme doesn't exist", async () => {
    const data = getMockData(),
      locals = getMockLocals(),
      { render } = getModel({ stationThemingApi: mockThemingApi.error });

    await render('', data, locals);

    expect(data._computed.primaryColor).to.equal('default primary color');
  });
});

function getMockLocals() {
  return {
    station: {
      id: 1,
      site_slug: 'some site slug'
    }
  };
}

function getMockData() {
  return { _computed: {} };
}
