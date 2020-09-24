'use strict';

const
  _get = require('lodash/get'),
  {
    getComponentInstance,
    putComponentInstance
  } = require('../../services/server/publish-utils'),
  { getComponentVersion } = require('clayutils'),
  addUriToCuratedItems = require('../../services/server/component-upgrades/add-uri-to-curated-items'),
  db = require('amphora-storage-postgres'),
  filterToExcludes = require('../../services/universal/component-upgrades/filter-to-excludes');

module.exports['1.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  const newData = Object.assign({}, data);

  newData.filterSecondaryArticleTypes = {};

  // Replace articleType with sectionFront
  if (data.filterSecondaryArticleType) {
    newData.filterSecondaryArticleTypes[data.filterSecondaryArticleType] = true;
  }
  delete newData.filterSecondaryArticleType;

  return newData;
};

module.exports['3.0'] = function (uri, data) {
  const sectionFronts = [
      'news',
      'sports',
      'music',
      'small-business-pulse'
    ],
    isSectionFront = sectionFronts.filter(sectionFront => uri.indexOf(`instances/${sectionFront}`) !== -1);

  data.filterTags = data.filterTags || [];

  // Only change the filter value for the HP instance
  if ((isSectionFront.length && !data.filterTags.filter(tag => tag.text === 'Radio.com Latino').length) || uri.indexOf('homepage') >= 0) {
    data.filterTags.push({ text: 'Radio.com Latino' });
  }

  return data;
};

module.exports['4.0'] = function (uri, data) {
  data.filterTags = data.filterTags || [];

  // Only change the filter value for the HP instance
  if (uri.indexOf('instances/home') >= 0 && typeof data.filterTags.find(tag => tag.text === 'Radio.com Latino') === 'undefined') {
    data.filterTags.push({ text: 'Radio.com Latino' });
  }

  return data;
};

module.exports['5.0'] = function (uri, data) {
  const contentCollectionLogoSponsorshipURIPublished = `${uri.split('more-content-feed')[0]}google-ad-manager/instances/contentCollectionLogoSponsorship`;

  return {
    ...data,
    contentCollectionLogoSponsorship: { _ref : contentCollectionLogoSponsorshipURIPublished }
  };
};

module.exports['6.0'] = function (uri, data) {
  const newData = Object.assign({}, data);

  newData.filterSecondarySectionFronts = data.filterSecondaryArticleTypes || {};

  delete newData.filterSecondaryArticleTypes;

  return newData;
};

module.exports['7.0'] = async function (uri, data) {
  const isPublished = getComponentVersion(uri) === 'published',
    sharethroughTagInstanceData = {
      adSize: 'sharethrough-tag',
      adLocation: 'btf',
      adPosition: 'native'
    },
    sharethroughTagInstanceUri = isPublished ?
      uri.replace(/\/more-content-feed\/instances\/.*/, '/google-ad-manager/instances/sharethroughTag@published') :
      uri.replace(/\/more-content-feed\/instances\/.*/, '/google-ad-manager/instances/sharethroughTag');

  if (sharethroughTagInstanceUri.includes('more-content-feed')) {
    return data;
  }

  try {
    const sharethroughTagInstance = await getComponentInstance(sharethroughTagInstanceUri);

    if (!data.sharethroughTag) {
      if (!sharethroughTagInstance) {
        await putComponentInstance(sharethroughTagInstanceUri, sharethroughTagInstanceData);
      }

      return {
        ...data,
        sharethroughTag: {
          _ref: sharethroughTagInstanceUri
        }
      };
    }

    return data;
  } catch (e) {
    await putComponentInstance(sharethroughTagInstanceUri, sharethroughTagInstanceData);

    return {
      ...data,
      sharethroughTag: {
        _ref: sharethroughTagInstanceUri
      }
    };
  }
};

module.exports['8.0'] = function (uri, data) {

  // adding editing abilities for the components title and visibility
  data.componentTitle = 'MORE from RADIO.COM';
  data.componentTitleVisible = true;

  return data;
};

module.exports['9.0'] = async function (uri, data) {
  if (data.primarySectionFront) {
    return data;
  }

  try {
    const sql = `
      SELECT data->>'primarySectionFront' as "primarySectionFront"
        , data->>'stationName' as station
      FROM components."section-front"
      WHERE data->'moreContentFeed'->>'_ref' ~ '${ uri }'
    `,
      results = await db.raw(sql),
      primarySectionFront = _get(results, 'rows[0].primarySectionFront'),
      station = _get(results, 'rows[0].station');

    return {
      ...data,
      primarySectionFront,
      station
    };
  } catch (e) {
    console.error('error upgrading', e.message);
    return data;
  }
};

module.exports['10.0'] = filterToExcludes;

module.exports['11.0'] = function (uri, data) {
  data.componentTitleVisible = false;

  return data;
};

module.exports['12.0'] = async (uri, data, locals) => {
  await addUriToCuratedItems(uri, data.items, locals);

  return data;
};

module.exports['13.0'] = function (uri, data) {
  return {
    ...data,
    enableSharethrough: true
  };
};

module.exports['14.0'] = function (uri, data) {
  delete data.tagInfo;

  return data;
};

module.exports['15.0'] = (uri, data) => {
  // Account for inccorrect formatting of data.tagManual in the database for previously created content.
  // Instances of data.tag that do not return an empty array, or properly formatted tag array will break the kiln UI.
  // e.g. tag array: data.tagManual: [] || data.tagManual: [{ text: 'tag' }].
  if (!data.tagManual || data.tagManual.length === 0) {
    data.tagManual = [];
    return data;
  } else if (Array.isArray(data.tagManual)) {
    data.tagManual = data.tagManual.map((tag) => typeof tag === 'string' ? { text: tag } : tag);
    return data;
  } else if (typeof data.tagManual === 'string') {
    data.tagManual = [{ text: data.tagManual }];
    return data;
  }

  return data;
};

module.exports['16.0'] = function (uri, data) {
  data.authors = data.authors || [];

  return data;
};
