'use strict';

const _get = require('lodash/get'),
  rest = require('../../services/universal/rest'),
  getComponentInstance = (uri, opts) => rest.get(`https://${uri}`, opts),
  putComponentInstance = (uri, body) => rest.put(`https://${uri}`, body, true);

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

// gallery layout was updated to add meta-tags component
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
      metaTagsUriPublished = uri.replace('gallery', 'meta-tags'),
      metaTagsUri = metaTagsUriPublished.replace('@published', ''),
      pageUriPublished = uri.replace('_components/gallery/instances', '_pages'),
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

// articles and galleries need to pass their tags down to the
//   meta-tags component.
module.exports['5.0'] = async (uri, data) => {
  const hash = /instances\/\d+/.test(uri);

  // only works for imported pages, migration should take care of Unity pages, new pages are already ok
  // Unity pages don't have the same hash for page and article/gallery component
  // only run on existing pages. importer doesn't send a version
  if (!(hash && data._version)) {
    return data;
  }

  // this shouldn't be declared above the short-circuit
  // eslint-disable-next-line one-var
  const nonPublishedUri = uri.replace('@published', ''),
    pageUri = nonPublishedUri.replace('_components/gallery/instances', '_pages');

  try {
    await getComponentInstance(pageUri);
  } catch (e) {
    // if the page doesn't exist then this the metadata will have been updated
    //   by the migration.
    if (_get(e, 'response.status') === 404) {
      return data;
    } else { // this error is unexpected, propagate it
      throw e;
    }
  }

  // this shouldn't be declared above the short-circuit
  // eslint-disable-next-line one-var
  const isPublished = uri.includes('@published'),
    metaTagsUri = nonPublishedUri.replace('gallery', 'meta-tags'),
    [metaTagsData, publishedMetaTagsData] = await Promise.all([
      getComponentInstance(metaTagsUri),
      isPublished ? getComponentInstance(metaTagsUri + '@published') : null
    ]),
    contentTagItems = data.tags.items;

  Object.assign(metaTagsData, { contentTagItems });
  if (isPublished) {
    Object.assign(publishedMetaTagsData, { contentTagItems });
  }

  await Promise.all([
    putComponentInstance(metaTagsUri, metaTagsData),
    isPublished
      ? putComponentInstance(metaTagsUri + '@published', publishedMetaTagsData)
      : null
  ]);

  return data;
};
