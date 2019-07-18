'use strict';

const addAdTags = require('../../services/universal/component-upgrades/add-ad-tags'),
  isEmpty = require('lodash/isEmpty'),
  cuid = require('cuid'),
  { getComponentInstance, getComponentVersion } = require('clayutils'),
  {
    getComponentInstance: getComponentInstanceObj,
    putComponentInstance
  } = require('../../services/server/publish-utils'),
  { setNoIndexNoFollow } = require('../../services/universal/create-content');

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
      page = await getComponentInstanceObj(pageUri);

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

module.exports['5.0'] = async function (uri, data) {
  // if sideShare has data then that means someone explicitly PUT or POSTed it
  //   so we should leave it be.
  if (!isEmpty(data.sideShare)) {
    return data;
  }

  const galleryInstanceId = getComponentInstance(uri),
    newShareUri = uri.replace(/\/gallery\/instances\/.*/, '/share/instances/new');

  // for the 'new' gallery we don't need to create a share instance because it
  //   should just refer to '/share/instances/new'
  if (galleryInstanceId === 'new') {
    return {
      ...data,
      sideShare: { _ref: newShareUri }
    };
  }

  // these shouldn't be declared above the 'new' short-circuit
  // eslint-disable-next-line one-var
  const isPublished = getComponentVersion(uri) === 'published',
    newShareData = await getComponentInstanceObj(newShareUri),
    shareInstanceData = Object.assign(newShareData, {
      pinImage: data.feedImgUrl,
      title: data.headline
    });

  let shareInstanceUri = newShareUri.replace('/instances/new', `/instances/${cuid()}`);

  if (isPublished) {
    shareInstanceUri += '@published';
  }

  await putComponentInstance(shareInstanceUri, shareInstanceData);

  return {
    ...data,
    sideShare: {
      _ref: shareInstanceUri
    }
  };
};

module.exports['6.0'] = (uri, data) => {
  return setNoIndexNoFollow(data);
};

// ensure adTags exists
module.exports['7.0'] = async function (uri, data) {
  data = addAdTags('gallery', uri, data);

  return data;
};
