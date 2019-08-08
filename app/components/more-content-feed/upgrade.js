'use strict';

module.exports['1.0'] = function (uri, data) {
  if (!data.contentType) {
    data.contentType = { article: true, gallery: true };
  }

  return data;
};

module.exports['2.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  let newData = Object.assign({}, data);

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
    data.filterTags.push({text: 'Radio.com Latino'});
  }

  return data;
};

module.exports['4.0'] = function (uri, data) {
  data.filterTags = data.filterTags || [];

  // Only change the filter value for the HP instance
  if (uri.indexOf('instances/home') >= 0 && typeof data.filterTags.find(tag => tag.text === 'Radio.com Latino') === 'undefined') {
    data.filterTags.push({text: 'Radio.com Latino'});
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
  let newData = Object.assign({}, data);

  newData.filterSecondarySectionFronts = data.filterSecondaryArticleTypes || {};
  
  delete newData.filterSecondaryArticleTypes;
  
  return newData;
};

module.exports['7.0'] = function (uri, data) {
  data.sharethroughTag = { _ref: '/_components/google-ad-manager/instances/sharethroughTag' };
  
  return data;
};
