'use strict';

const expected = require('./expected'),
  mock = require('./mock'),
  transform = require('../freq-content'),
  { expect } = require('chai');

describe('freq-content', () => {
  it('should transform an article', () => {
    const result = transform(mock.article, mock.locals);

    expect(result).to.deep.equal(expected.article);
  });

  it('should transform a gallery', () => {
    const result = transform(mock.gallery, mock.locals);

    expect(result).to.deep.equal(expected.gallery);
  });
});
