'use strict';

const _round = require('lodash/round'),
  convertSize = require('../convert-size'),
  constants = require('../constants'),
  { image } = constants.msnFeed,
  { ratio: { min: minRatio, max: maxRatio } } = image.recommended,
  { maxSide, maxSizeMb, maxSizeB, minSide } = image.required,
  /**
   * Gets the computed properties related to images in the msn feed.
   *
   * image components use this to provide feedback to editors regarding msn feed
   *   requirements and important recommendations.
   *
   * @param {object} data
   * @param {obejct} locals
   * @returns {object}
   */
  getComputedMsnFeedProps = (data, locals) => {
    const { is404, width, height, sizeInBytes, url } = data,
      imageRatio = _round(width / height, 3),
      largerThanMaxSize = sizeInBytes > maxSizeB,
      sizeInMb = _round(convertSize(sizeInBytes, { from: 'b', to: 'mb' }), 3),
      smallerThanMinSide = width < minSide || height < minSide,
      longerThanMaxSide = width > maxSide || height > maxSide,
      outsideRecommendedRatio = imageRatio > maxRatio
        || imageRatio < minRatio,
      useInMsnFeed = url
        && !is404
        && !largerThanMaxSize
        && !smallerThanMinSide
        && !longerThanMaxSide;

    let msnFeedUrl = url;

    if (longerThanMaxSide) {
      const side = width > height
        ? 'width'
        : 'height';

      msnFeedUrl += `?${side}=${maxSide}`;
    }

    return {
      msnFeed: {
        constants: {
          minSide,
          maxRatio,
          minRatio,
          maxSizeMb
        },
        showOutsideRecommendedRatio: locals.edit && outsideRecommendedRatio,
        showLargerThanMaxSize: locals.edit && largerThanMaxSize,
        showSmallerThanMinSide: locals.edit && smallerThanMinSide,
        url: msnFeedUrl
      },
      // imageRatio and sizeInMb were introduced for the msn feed but it may
      //   make sense to extract them somewhere more generic in the future
      imageRatio,
      sizeInMb,
      useInMsnFeed
    };
  };

module.exports = getComputedMsnFeedProps;
