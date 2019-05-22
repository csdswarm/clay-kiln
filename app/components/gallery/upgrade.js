'use strict';

module.exports['1.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  let newData = Object.assign({}, data);

  // Replace articleType with sectionFront, add new contentType property
  newData.secondaryArticleType = data.secondaryGalleryType || '';
  delete newData.secondaryGalleryType;

  return newData;
};

module.exports['2.0'] = (uri, data) => {
  return typeof data.footer === 'undefined' ? {
    ...data,
    footer: []
  } : data;
};

module.exports['3.0'] = function (uri, data) {
  const contentLogoSponsorshipURIPublished = `${uri.split('gallery')[0]}google-ad-manager/instances/contentPageLogoSponsorship`;

  return {
    ...data,
    contentPageSponsorLogo: { _ref : contentLogoSponsorshipURIPublished }
  };
};

module.exports['4.0'] = function (uri, data) {
  const newData = {
    ...data,
    secondarySectionFront: data.secondaryArticleType || ''
  };

  delete newData.secondaryArticleType;
  return newData;
};
