'use strict';

const _pick = require('lodash/pick'),
  proxyquire = require('proxyquire').noPreserveCache(),
  { expect } = require('chai'),
  { jsdom } = require('jsdom');

const dom = new jsdom(),
  domGlobals = ['atob', 'document', 'window'],
  oldGlobals = _pick(global, domGlobals),
  getNonVueState = () => proxyquire('./non-vue-state', {});

describe('non-vue-state', () => {
  before(() => {
    Object.assign(global, _pick(dom.defaultView, domGlobals));
  });

  after(() => {
    Object.assign(global, oldGlobals);
  });

  it('gets and sets state.loadedIds', () => {
    const { getLoadedIds, setLoadedIds } = getNonVueState();

    expect(getLoadedIds()).to.deep.equal([]);

    setLoadedIds(['a', 'b', 'c']);

    expect(getLoadedIds()).to.deep.equal(['a', 'b', 'c']);
  });

  it('removes duplicates and sorts loaded ids', () => {
    const { getLoadedIds, setLoadedIds } = getNonVueState();

    setLoadedIds(['second', 'first', 'third', 'first']);

    expect(getLoadedIds()).to.deep.equal(['first', 'second', 'third']);
  });

  it('initializes loadedIds from window.spaPayload', () => {
    window.spaPayload = Buffer.from(JSON.stringify({
      locals: { loadedIds: ['a', 'b', 'c'] }
    })).toString('base64');

    const { getLoadedIds } = getNonVueState();

    expect(getLoadedIds()).to.deep.equal(['a', 'b', 'c']);
  });
});
