'use strict';
const adSizes = {
  billboard: {
    defaultSize: [970,250]
  },
  'footer-billboard': {
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
  'half-page-topic': {
    defaultSize: [300, 600]
  },
  'medium-rectangle': {
    defaultSize: [300, 250]
  },
  'mobile-adhesion': {
    defaultSize: [320, 50]
  },
  'logo-sponsorship': {
    defaultSize: [100, 35]
  },
  'mobile-interstitial': {
    defaultSize: [1, 7]
  },
  'global-logo-sponsorship': {
    defaultSize: [100, 35]
  },
  'content-collection-logo-sponsorship': {
    defaultSize: [100, 35]
  },
  'content-page-logo-sponsorship': {
    defaultSize: [100, 35]
  },
  'sharethrough-tag': {
    defaultSize: [1, 1]
  }
};

module.exports = {
  adSizes,
  sizeMapping: {},
  setupSizeMapping: function () {
    const sizeMapping = this.sizeMapping;

    googletag.cmd.push(function () {
      sizeMapping['billboard'] = googletag.sizeMapping()
        .addSize([1024, 0], [[970, 250], [970, 90], [728, 90]])
        .addSize([480, 0], [[728, 90]])
        .addSize([0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]])
        .build();

      sizeMapping['footer-billboard'] = googletag.sizeMapping()
        .addSize([1279, 0], [[970, 250], [970, 90], [728, 90]])
        .addSize([480, 0], [[728, 90]])
        .addSize([0, 0], [[320, 100], [300, 100], [320, 50], [300, 50], [300,250]])
        .build();

      sizeMapping['super-leaderboard'] = googletag.sizeMapping()
        .addSize([1024, 0], [[970, 90], [728, 90]])
        .addSize([480, 0], [[728, 90]])
        .addSize([0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]])
        .build();

      sizeMapping['leaderboard'] = googletag.sizeMapping()
        .addSize([480, 0], [[728, 90]])
        .addSize([0, 0], [[320, 100], [300, 100], [320, 50], [300, 50]])
        .build();

      sizeMapping['half-page'] = googletag.sizeMapping()
        .addSize([1023, 0], [[300, 600], [300, 250]])
        .addSize([0, 0], [[300, 250]])
        .build();

      sizeMapping['half-page-topic'] = googletag.sizeMapping()
        .addSize([1023, 0], [[300, 600], [300, 250]])
        .addSize([0, 0], [])
        .build();

      sizeMapping['medium-rectangle'] = googletag.sizeMapping()
        .addSize([0, 0], [[300, 250]])
        .build();

      sizeMapping['mobile-adhesion'] = googletag.sizeMapping()
        .addSize([480, 0], [])
        .addSize([0, 0], [[320, 50]])
        .build();

      sizeMapping['logo-sponsorship'] = googletag.sizeMapping()
        .addSize([0, 0], [[100, 35]])
        .build();

      sizeMapping['mobile-interstitial'] = googletag.sizeMapping()
        .addSize([0, 0], [[1, 7]])
        .build();

      sizeMapping['global-logo-sponsorship'] = googletag.sizeMapping()
        .addSize([0, 0], [[100, 35]])
        .build();

      sizeMapping['content-collection-logo-sponsorship'] = googletag.sizeMapping()
        .addSize([0, 0], [[100, 35]])
        .build();

      sizeMapping['content-page-logo-sponsorship'] = googletag.sizeMapping()
        .addSize([0, 0], [[100, 35]])
        .build();

      sizeMapping['sharethrough-tag'] = googletag.sizeMapping()
        .addSize([0, 0], [[1, 1]])
        .build();

    });
  }
};
