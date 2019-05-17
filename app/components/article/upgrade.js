'use strict';

module.exports['1.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  let newData = Object.assign({}, data);

  // Replace articleType with sectionFront, add new contentType property
  newData.sectionFront = data.sectionFront || data.articleType || '';
  newData.contentType = 'article';
  delete newData.articleType;
  delete newData.section;

  return newData;
};

module.exports['2.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  let newData = Object.assign({}, data);

  if (!data.dateModified) {
    newData.dateModified = data.date;
  }
  return newData;
};

module.exports['3.0'] = function (uri, data) {
  const contentLogoSponsorshipURIPublished = `${uri.split('article')[0]}google-ad-manager/instances/contentPageLogoSponsorship`;

  return {
    ...data,
    contentPageSponsorLogo: { _ref : contentLogoSponsorshipURIPublished }
  };
};

module.exports['4.0'] = function (uri, data) {
  return {
    ...data,
    secondarySectionFront: data.secondaryArticleType || ''
  };
};
