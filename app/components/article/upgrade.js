'use strict';

const rest = require('../../services/universal/rest'),
  getComponentInstance = (uri, opts) => rest.get(`https://${uri}`, opts),
  putComponentInstance = (uri, body) => rest.put(`https://${uri}`, body, true);

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
  const hash = uri.match(/instances\/(\d+)/);

  // only works for imported pages, migration should take care of Unity pages, new pages are already ok
  // Unity pages don't have the same hash for page and article/gallery component
  // only run on existing pages. importer doesn't send a version
  if (hash && data._version) {
    const metaTagsData = {
        authors: data.authors,
        publishDate: data.date,
        automatedPublishDate: data.dateModified,
        contentType: data.contentType,
        sectionFront: data.sectionFront,
        secondaryArticleType: data.secondaryArticleType,
        metaTags: []
      },
      published = uri.includes('@published'),
      metaTagsUriPublished = uri.replace('article', 'meta-tags'),
      metaTagsUri = metaTagsUriPublished.replace('@published', ''),
      pageUriPublished = uri.replace('_components/article/instances', '_pages'),
      pageUri = pageUriPublished.replace('@published', ''),
      page = await getComponentInstance(pageUri);

    if (page && page.head && !page.head.includes(metaTagsUri)) {

      page.head.push(metaTagsUri);
      // create meta-tags component instance
      // don't wait for it, let it run and it should be updated by the next page load.
      putComponentInstance(metaTagsUri, metaTagsData)
        .then(() => {
          if (published) {
            return putComponentInstance(metaTagsUriPublished, metaTagsData);
          } else {
            return;
          }
        })
        .then(putComponentInstance(pageUri, page))
        .then(() => {
          if (published) {
            return putComponentInstance(pageUriPublished, page);
          } else {
            return;
          }
        });
    }
  }

  return data;
};

module.exports['5.0'] = function (uri, data) {
  let newData = Object.assign({}, data);

  newData.secondarySectionFront = data.secondaryArticleType || '';

  delete newData.secondaryArticleType;

  return newData;
};
