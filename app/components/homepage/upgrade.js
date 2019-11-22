'use strict';

const { getComponentInstance, putComponentInstance } = require('../../services/server/publish-utils'),
  publishedUri = uri => `${uri}@published`;

module.exports['1.0'] = async function (uri, data) {
  const { moreContentFeed, ...restOfHomepageData } = data,
    twoColumnComponentRef = moreContentFeed._ref.replace('more-content-feed', 'two-column-component'),
    rightRailRef = moreContentFeed._ref.replace('more-content-feed', 'more-content-feed-right-rail'),
    twoColumnComponentData = {
      column1: [
        {
          _ref: moreContentFeed._ref
        }
      ],
      column2: [
        {
          _ref: rightRailRef
        }
      ]
    },
    {
      contentCollectionLogoSponsorship,
      googleAdRightRail,
      ...moreContentFeedData
    } = await getComponentInstance(moreContentFeed._ref),
    rightRailData = {
      locationOfRightRail: moreContentFeed.locationOfContentFeed,
      contentCollectionLogoSponsorship,
      googleAdRightRail
    };
  
  // Create more-content-feed-right-rail
  await putComponentInstance(rightRailRef, rightRailData);
  await putComponentInstance(publishedUri(rightRailRef), rightRailData);
  // Update more-content-feed without rightRail values
  await putComponentInstance(moreContentFeed._ref, moreContentFeedData);
  await putComponentInstance(publishedUri(moreContentFeed._ref), moreContentFeedData);
  // Create two-column-component
  await putComponentInstance(twoColumnComponentRef, twoColumnComponentData);
  await putComponentInstance(publishedUri(twoColumnComponentRef), twoColumnComponentData);

  return {
    ...restOfHomepageData,
    twoColumnComponent: {
      _ref: moreContentFeed._ref.replace('more-content-feed', 'two-column-component')
    }
  };
};
