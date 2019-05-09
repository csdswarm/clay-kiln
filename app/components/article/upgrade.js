'use strict';

const { getComponentInstance, putComponentInstance } = require('../../services/server/publish-utils');

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

// new-two-col layout was updated to add meta-tags component
module.exports['4.0'] = async (uri, data) => {
  console.log(uri);
  const hash = uri.match(/instances\/(\d+)/);
  console.log(hash);

  // only works for imported pages, migration should take care of Unity pages, new pages are already ok
  // Unity pages don't have the same hash for page and article/gallery component
  if (hash) {
    const metaTagsData = {
        authors: data.authors,
        publishDate: data.date,
        automatedPublishDate: data.dateModified,
        contentType: data.contentType,
        sectionFront: data.sectionFront,
        secondaryArticleType: data.secondaryArticleType,
        metaTags: []
      },
      metaTagsUriPublished = uri.replace('article', 'meta-tags'),
      metaTagsUri = metaTagsUriPublished.replace('@published', ''),
      pageUriPublished = uri.replace('_components/article/instances', '_pages'),
      pageUri = pageUriPublished.replace('@published', ''),
      page = await getComponentInstance(pageUri);

    if (page && page.head && !page.head.includes(metaTagsUri)) {

      page.head.push(metaTagsUri);

      // create meta-tags component instance
      await Promise.all([
        putComponentInstance(metaTagsUri, metaTagsData),
        putComponentInstance(metaTagsUriPublished, metaTagsData),
        putComponentInstance(pageUri, page),
        putComponentInstance(pageUriPublished, page)
      ]);
    }
  }

  return data;
};
