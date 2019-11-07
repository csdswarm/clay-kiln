'use strict';

module.exports['16.0'] = function (uri, data) {
  const { moreContentFeed, twoColumnComponent, ...rest } = data,
    updatedTwoColumnComponent = twoColumnComponent || {
      _ref: moreContentFeed._ref.replace('more-content-feed', 'two-column-component')
    },
    newData = {
      ...rest,
      twoColumnComponent: updatedTwoColumnComponent
    };

  console.log({ uri, data, newData });
  return newData;
};
