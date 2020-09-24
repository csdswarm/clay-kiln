'use strict';

const _merge = require('lodash/merge'),
  { expect } = require('chai'),
  { render } = require('./model');

const defaultLocals = {
  station: { id: 1 },
  url: 'https://clay.radio.com/music'
};

describe('top-nav > model', () => {
  it('should only set the current header link for the national station', () => {
    let data = getMockData(),
      locals = getMockLocals(),
      result = render('', data, locals);

    const noHeaderLinksAreCurrent = result.headerLinks.every(({ current }) => !current);

    expect(noHeaderLinksAreCurrent).to.be.true;

    data = getMockData();
    locals = getMockLocals({ station: { id: 0 } });
    result = render('', data, locals);

    expect(result.headerLinks[0].current).to.be.true;
  });
});

function getMockData() {
  return {
    headerLinks: [{ url: '/music' }]
  };
}

function getMockLocals(localsOverride) {
  return _merge({}, defaultLocals, localsOverride);
}
