'use strict';

const { isEmpty } = require('lodash');
const cuid = require('cuid');
const publishUtils = require('../../services/server/publish-utils');
const { getComponentInstance, getComponentVersion } = require('clayutils');

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
      page = await publishUtils.getComponentInstance(pageUri);

    if (page && page.head && !page.head.includes(metaTagsUri)) {

      page.head.push(metaTagsUri);
      // create meta-tags component instance
      // don't wait for it, let it run and it should be updated by the next page load.
      publishUtils.putComponentInstance(metaTagsUri, metaTagsData)
        .then(() => {
          if (published) {
            return publishUtils.putComponentInstance(metaTagsUriPublished, metaTagsData);
          } else {
            return;
          }
        })
        .then(publishUtils.putComponentInstance(pageUri, page))
        .then(() => {
          if (published) {
            return publishUtils.putComponentInstance(pageUriPublished, page);
          } else {
            return;
          }
        });
    }
  }

  return data;
};

module.exports['5.0'] = async function (uri, data) {
  if (!isEmpty(data.sideShare)) {
    return data;
  }

  const galleryInstanceId = getComponentInstance(uri),
    newShareUri = uri.replace(/\/gallery\/instances\/.*/, '/share/instances/new');

  if (galleryInstanceId === 'new') {
    return {
      ...data,
      sideShare: { _ref: newShareUri }
    };
  }

  // these shouldn't be declared above the 'new' short-circuit
  // eslint-disable-next-line one-var
  const isPublished = getComponentVersion(uri) === 'published',
    newShareData = await publishUtils.getComponentInstance(newShareUri),
    shareInstanceData = Object.assign(newShareData, {
      pinImage: data.feedImgUrl,
      title: data.headline
    });

  let shareInstanceUri = newShareUri.replace('/instances/new', `/instances/${cuid()}`);

  if (isPublished) {
    shareInstanceUri += '@published';
  }

  await publishUtils.putComponentInstance(shareInstanceUri, shareInstanceData);

  return {
    ...data,
    sideShare: {
      _ref: shareInstanceUri
    }
  };
};
