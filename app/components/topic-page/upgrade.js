'use strict';

module.exports['1.0'] = function (uri, data) {
  const { moreContentFeed, twoColumnComponent, ...rest } = data,
    updatedTwoColumnComponent = twoColumnComponent || {
      _ref: moreContentFeed._ref.replace('more-content-feed', 'two-column-component')
    },
    newData = {
      ...rest,
      twoColumnComponent: updatedTwoColumnComponent
    };

  return newData;
};
