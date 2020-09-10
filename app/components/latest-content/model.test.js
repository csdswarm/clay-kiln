'use strict';

const _noop = require('lodash/noop'),
  proxyquire = require('proxyquire').noCallThru(),
  { expect } = require('chai');

const { render } = proxyquire('./model.js', {
  '../../services/universal/content-type': _noop,
  '../../services/server/query': _noop,
  '../../services/universal/recirc/recirc-cmpt': _noop,
  '../../services/universal/recirc/recirculation': _noop,
  '../../services/universal/constants': _noop,
  clayutils: _noop
});

describe('latest-content/model.js', () => {
  describe('render', () => {
    it('returns data when isCustomColumns is true', async () => {
      const data = { hasCustomColumns: true };

      expect(await render('some uri', data)).to.equal(data);
    });
  });
});
