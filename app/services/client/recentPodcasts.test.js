'use strict';

var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  expect = require('chai').expect;

require('mock-local-storage');

describe(`${dirname}/${filename}`, () => {
  global.window = global.localStorage;
  const recentPodcasts = require('./recentPodcasts');

  it('gets recent podcasts', () => {
    localStorage.clear();

    expect(
      recentPodcasts.get()
    ).to.deep.equal([]);

    recentPodcasts.add(12);
    expect(
      recentPodcasts.get()
    ).to.deep.equal([12]);
  });

  it('adds a recent podcast to front of list', () => {
    localStorage.clear();

    recentPodcasts.add(12);
    expect(
      recentPodcasts.add(34)
    ).to.deep.equal([34, 12]);
  });

  /**
   * NOTE:
   * This is necessary to prevent it from messing with
   * the globals for downstream tests
   */
  delete global.window;
});
