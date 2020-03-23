'use strict';

const CLAY_SITE_HOST = process.env.CLAY_SITE_HOST,
  _pick = require('lodash/pick'),
  publishedUri = uri => `${uri}@published`,
  { getComponentInstance, putComponentInstance } = require('../../../services/server/publish-utils'),
  { getComponentInstance: getComponentInstanceName } = require('clayutils');

module.exports = async function (uri, data) {
  const {
      googleAdUnderStationsModule,
      podcastList,
      sectionLead,
      stationsCarousel,
      twoColumnComponent,
      includePodcastModule,
      ...restOfData
    } = data,
    // Create new multi-column component, as well as the components to fill it
    [newMultiColumnComponent, newLatestRecirculationComponent, newMinifiedContentFeedComponent, twoColumnComponentData] = await Promise.all([
      getComponentInstance(`${CLAY_SITE_HOST}/_components/multi-column/instances/new`),
      getComponentInstance(`${CLAY_SITE_HOST}/_components/latest-recirculation/instances/new`),
      getComponentInstance(`${CLAY_SITE_HOST}/_components/minified-content-feed/instances/new`),
      // Get two-column component data
      getComponentInstance(twoColumnComponent._ref)
    ]),
    // Find more-content-feed in two-column-component
    moreContentFeedRef = twoColumnComponentData.col1.find(({ _ref }) => _ref.includes('more-content-feed'))._ref.replace('@published', ''),
    // Create readable refs for the new components
    newMultiColumnComponentRef = uri.replace('section-front', 'multi-column').replace('@published', '').concat('-section-front'),
    newLatestRecirculationRef = uri.replace('section-front', 'latest-recirculation').replace('@published', '').concat('-section-front'),
    newMinifiedContentFeedRef = uri.replace('section-front', 'minified-content-feed').replace('@published', '').concat('-section-front'),
    // Get actual more-content-feed data to have recirc data
    moreContentFeedComponent = await getComponentInstance(moreContentFeedRef),
    // Pull recirc data fields to set in new latest-recirculation and minified-content-feed components
    recircComponent = _pick(moreContentFeedComponent, [
      'contentType',
      'populateFrom',
      'sectionFront',
      'secondarySectionFront',
      'tag',
      'excludeSectionFronts',
      'excludeSecondarySectionFronts',
      'excludeTags',
      'locationOfContentFeed'
    ]);

  // Leave sectionFrontContent empty for new instance (excluding the google-ad-manager)
  if (getComponentInstanceName(uri) === 'new') {
    return {
      sectionFrontContent: [
        googleAdUnderStationsModule
      ],
      ...restOfData
    };
  }

  //  Create new latest-recirculation component
  await putComponentInstance(newLatestRecirculationRef, { ...newLatestRecirculationComponent, ...recircComponent });
  await putComponentInstance(publishedUri(newLatestRecirculationRef), { ...newLatestRecirculationComponent, ...recircComponent });

  // Create new minified-content-feed component
  await putComponentInstance(newMinifiedContentFeedRef, { ...newMinifiedContentFeedComponent, ...recircComponent });
  await putComponentInstance(publishedUri(newMinifiedContentFeedRef), { ...newMinifiedContentFeedComponent, ...recircComponent });

  // Add current section-lead, and new latest-recirculation and minified-content-feed to the new multi-column component
  newMultiColumnComponent.col1.push(sectionLead);
  newMultiColumnComponent.col2.push({ _ref: newLatestRecirculationRef });
  newMultiColumnComponent.col3.push({ _ref: newMinifiedContentFeedRef });

  // Create multi-column component
  await putComponentInstance(newMultiColumnComponentRef, newMultiColumnComponent);
  await putComponentInstance(publishedUri(newMultiColumnComponentRef));

  // Return the section front data in the new schema format
  return {
    sectionFrontContent: [
      {
        _ref: publishedUri(newMultiColumnComponentRef)
      },
      ...stationsCarousel,
      googleAdUnderStationsModule,
      ...(includePodcastModule ? [podcastList] : []),
      twoColumnComponent
    ],
    ...restOfData
  };
};
