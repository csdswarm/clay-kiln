'use strict';

const _get = require('lodash/get'),
  addAdTags = require('../../services/server/component-upgrades/add-ad-tags'),
  addTextTags = require('../../services/server/component-upgrades/add-text-tags'),
  updateStationSyndication = require('../../services/server/component-upgrades/update-stationsyndication-type'),
  { getComponentInstance, putComponentInstance } = require('../../services/server/publish-utils'),
  { setNoIndexNoFollow } = require('../../services/universal/create-content'),
  defaultTextWithOverride = {
    onModelSave: require('../../services/kiln/plugins/default-text-with-override/on-model-save')
  },
  { componentizeFeedImg } = require('./upgrade-helpers');

module.exports['1.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  const newData = Object.assign({}, data);

  // Replace articleType with sectionFront, add new contentType property
  newData.sectionFront = data.sectionFront || data.articleType || '';
  newData.contentType = 'article';
  delete newData.articleType;
  delete newData.section;

  return newData;
};

module.exports['2.0'] = function (uri, data) {
  // Clone so we don't lose value by reference
  const newData = Object.assign({}, data);

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
  const hash = uri.match(/instances\/(sbp-\d+|\d+)/);

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

module.exports['5.0'] = (uri, data) => {
  return setNoIndexNoFollow(data);
};

// articles and galleries need to pass their tags down to the
//   meta-tags component.
module.exports['6.0'] = async (uri, data) => {
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
    pageUri = nonPublishedUri.replace('_components/article/instances', '_pages');

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
    metaTagsUri = nonPublishedUri.replace('article', 'meta-tags'),
    tagsUri = nonPublishedUri.replace('article', 'tags'),
    [
      metaTagsData,
      publishedMetaTagsData,
      tagsData,
      publishedTagsData
    ] = await Promise.all([
      getComponentInstance(metaTagsUri),
      isPublished ? getComponentInstance(metaTagsUri + '@published') : null,
      getComponentInstance(tagsUri),
      isPublished ? getComponentInstance(tagsUri + '@published') : null
    ]);

  Object.assign(metaTagsData, { contentTagItems: tagsData.items });
  if (isPublished) {
    Object.assign(publishedMetaTagsData, { contentTagItems: publishedTagsData.items });
  }

  await Promise.all([
    putComponentInstance(metaTagsUri, metaTagsData),
    isPublished
      ? putComponentInstance(metaTagsUri + '@published', publishedMetaTagsData)
      : null
  ]);

  return data;
};

// ensure adTags exists
module.exports['7.0'] = async function (uri, data) {
  data = await addAdTags('article', uri, data);

  return data;
};

module.exports['8.0'] = function (uri, data) {
  const newData = Object.assign({}, data);

  if (data.secondaryArticleType) {
    newData.secondarySectionFront = data.secondaryArticleType || '';
    delete newData.secondaryArticleType;
  }

  return newData;
};

module.exports['9.0'] = function (uri, data) {
  const newData = Object.assign({}, data);

  newData.secondarySectionFront = data.secondarySectionFront === 'Small Business Pulse' ? data.secondarySectionFront.toLowerCase() : data.secondarySectionFront;

  return newData;
};

module.exports['10.0'] = (uri, data) => {
  data.feeds.smartNews = true;

  return data;
};

module.exports['11.0'] = async (uri, data) => {
  defaultTextWithOverride.onModelSave.handleDefault('msnTitle', 'headline', data);
  data.msnTitleLength = _get(data.msnTitle, 'length', 0);
  data.feeds.msn = true;

  await componentizeFeedImg(uri, data);

  return data;
};

module.exports['12.0'] = updateStationSyndication;

module.exports['13.0'] = (uri, data) => {
  data.featured = data.featured || false;
  data.featuredSports = false;
  data.featuredNews = false;

  return data;
};

module.exports['14.0'] = (uri, data) => {
  data.stationSyndication.map(syndication => syndication.source = syndication.source || 'manual syndication');

  return data;
};

module.exports['15.0'] = addTextTags;

module.exports['16.0'] = (uri, data) => {
  if (data.hosts === undefined) {
    data.hosts = [];
  }
  if (!data.byline[0].hosts) {
    data.byline[0].hosts = [];
  }

  return data;
};
