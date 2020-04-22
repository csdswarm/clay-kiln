'use strict';

const { getComponentInstance: getComponentInstanceName } = require('clayutils');

module.exports = async function (uri, data) {
  const {
    googleAdUnderStationsModule,
    podcastList,
    sectionLead,
    twoColumnComponent,
    includePodcastModule,
    ...restOfData
  } = data;

  // Leave mainContent empty for new instance (excluding the google-ad-manager)
  if (getComponentInstanceName(uri) === 'new') {
    return {
      mainContent: [
        googleAdUnderStationsModule
      ],
      ...restOfData
    };
  }

  // Return the section front data in the new schema format
  return {
    mainContent: [
      sectionLead,
      googleAdUnderStationsModule,
      ...(includePodcastModule ? [podcastList] : []),
      twoColumnComponent
    ],
    ...restOfData
  };
};
