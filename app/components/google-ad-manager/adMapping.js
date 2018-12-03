'use strict';
const adSizes = {
  billboard: {
    defaultSize: [970,250]
  },
  'super-leaderboard': {
    defaultSize: [970,90]
  },
  leaderboard: {
    defaultSize: [728,90]
  },
  'half-page': {
    defaultSize: [300, 600]
  },
  'medium-rectangle': {
    defaultSize: [300, 250]
  },
  mobile: {
    defaultSize: [320, 100]
  },
  'logo-sponsorship': {
    defaultSize: [100, 35]
  }
};

module.exports = {
  adSizes,
  sizeMapping: {},
  setupSizeMapping: function () {
    let sizeMapping = this.sizeMapping;

    googletag.cmd.push(function () {
      sizeMapping['billboard'] = googletag.sizeMapping()
        .addSize([1279, 0], [[970, 250], [970, 90], [728, 90]])
        .addSize([480, 0], [[728, 90]])
        .addSize([0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]])
        .build();

      sizeMapping['super-leaderboard'] = googletag.sizeMapping()
        .addSize([1279, 0], [[970, 90], [728, 90]])
        .addSize([480, 0], [[728, 90]])
        .addSize([0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]])
        .build();

      sizeMapping['leaderboard'] = googletag.sizeMapping()
        .addSize([480, 0], [[728, 90]])
        .addSize([0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]])
        .build();

      sizeMapping['half-page'] = googletag.sizeMapping()
        .addSize([0, 0], [[300, 600]])
        .build();

      sizeMapping['medium-rectangle'] = googletag.sizeMapping()
        .addSize([0, 0], [[300, 250]])
        .build();

      sizeMapping['mobile'] = googletag.sizeMapping()
        .addSize([480, 0], [])
        .addSize([0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]])
        .build();

      sizeMapping['logo-sponsorship'] = googletag.sizeMapping()
        .addSize([0, 0], [[100, 35]])
        .build();
    });
  }
};
