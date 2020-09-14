'use strict';

const getComputedImageProps = require('./get-computed-image-props'),
  { expect } = require('chai');

describe('get-computed-image-props', () => {
  it('is used in msn feed even when a side is longer than max', () => {
    let data = getMockImageData({ height: 4001 }),
      result = getComputedImageProps(data, {});

    expect(result.useInMsnFeed).to.be.true;

    data = getMockImageData({ width: 4001 });
    result = getComputedImageProps(data, {});

    expect(result.useInMsnFeed).to.be.true;
  });
});

function getMockImageData(override) {
  return Object.assign(
    {
      height: 300,
      sizeInBytes: 1000,
      url: 'some url',
      width: 300
    },
    override
  );
}
