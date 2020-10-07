'use strict';

const { getComponentInstance, putComponentInstance } = require('../../server/publish-utils'),
  CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  publishedUri = uri => `${uri}@published`;

module.exports = async function (uri, data) {
  const { moreContentFeed, ...restOfData } = data;

  if (moreContentFeed) {
    const defaultContentCollectionLogoSponsorship = {
        _ref: `${CLAY_SITE_HOST}/_components/google-ad-manager/instances/contentCollectionLogoSponsorship`
      },
      defaultGoogleAdRightRail = {
        _ref: `${CLAY_SITE_HOST}/_components/google-ad-manager/instances/halfPageBottomTopic`
      },
      twoColumnComponentRef = moreContentFeed._ref.replace('more-content-feed', 'two-column-component'),
      {
        contentCollectionLogoSponsorship = defaultContentCollectionLogoSponsorship,
        googleAdRightRail = defaultGoogleAdRightRail,
        ...moreContentFeedData
      } = await getComponentInstance(moreContentFeed._ref),
      twoColumnComponentData = {
        col1: [
          {
            _ref: moreContentFeed._ref
          }
        ],
        col2: [
          contentCollectionLogoSponsorship,
          googleAdRightRail
        ]
      };

    // Update more-content-feed without rightRail values
    await putComponentInstance(moreContentFeed._ref, moreContentFeedData);
    await putComponentInstance(publishedUri(moreContentFeed._ref), moreContentFeedData);
    // Create two-column-component
    await putComponentInstance(twoColumnComponentRef, twoColumnComponentData);
    await putComponentInstance(publishedUri(twoColumnComponentRef), twoColumnComponentData);

    return {
      ...restOfData,
      twoColumnComponent: {
        _ref: moreContentFeed._ref.replace('more-content-feed', 'two-column-component')
      }
    };
  }

  return data;
};
