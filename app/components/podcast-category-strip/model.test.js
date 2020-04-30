'use strict';

const { expect } = require('chai');

describe('podcast-category-strip component', () => {
  const { save, render } = require('./model');

  describe('save', () => {
    it('blah', async () => {
      const
        ref = '_components/podcast-category-strip/instances/1',
        data = {},
        locals = {},
        result = await save(ref, data, locals);

      expect(result).to.eql({});
    });
  });

  describe('render', () => {
    it('blah', async () => {
      const
        ref = '_components/podcast-category-strip/instances/1',
        data = {},
        locals = {},
        result = await render(ref, data, locals);

      expect(result).to.eql({ _computed: {} });
    });
  });
});
