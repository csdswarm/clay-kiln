'use strict';

const _get = require('lodash/get'),
  _isEmpty = require('lodash/isEmpty'),
  _without = require('lodash/without'),
  _uniq = require('lodash/uniq'),
  parse = require('url-parse'),
  getTrackingData = require('../../services/universal/analytics/get-tracking-data'),
  getPageData = require('../../services/universal/analytics/get-page-data'),
  { NMC, OG_TYPE, EDITORIAL_TAGS } = require('../../services/universal/analytics/shared-tracking-vars'),
  { getBranchMetaTags } = require('../../services/server/branch-io');

/**
 * Returns properties for the Nielsen Marketing Cloud tags dependent on whether
 * any were imported.
 *
 * @param {object} componentData
 * @param {object} locals
 * @returns {object}
 */
function getNmcData(componentData, locals) {
  const { station, url } = locals,
    pathname = parse(url).pathname,
    pageData = getPageData(pathname, componentData.contentType, station.site_slug),
    editorialTags = [componentData.sectionFront, componentData.secondarySectionFront, ...(componentData.contentTagItems || []).map(i => i.text)].filter(Boolean),
    // imported content tags is been created with slashes instead of commas, using this pattern when the importer is updated we won't need to update Unity side.
    nmcImportedTags = _get(componentData, 'importedNmcData.tag', '').replace(/\//g, ',').split(','),
    contentTags = _uniq(editorialTags.concat(nmcImportedTags).filter(Boolean)),
    nmcMutableData = _get(componentData, 'importedNmcData', null),
    nmcData = getTrackingData({
      contentTags,
      pageData,
      pathname,
      station
    });

  // the imported pid is always a bogus value 'api_v1.1_blogs'.  We know this
  //   is bogus because it's not the value in the article's html.
  nmcMutableData
    ? nmcMutableData.pid = nmcData.pid
    : null;
  
  nmcData.tag = nmcData.tag.join(',');

  return nmcData;
}

module.exports.render = async (ref, data, locals) => {
  const AUTHOR_NAME = 'article:author:name',
    PUB_TIME = 'article:published_time',
    CATEGORY = 'cXenseParse:recs:category',
    STATION_CALL_LETTERS = 'station-call-letters',
    categories = [],
    { station } = locals,
    { importedNmcData = {} } = data,
    // if we don't have imported data then we want to use the same logic
    //   google-ad-manager/client.js was using prior to introducing the Nielsen
    //   Marketing Cloud tags.
    hasImportedNmcData = !_isEmpty(importedNmcData),
    nmcData = getNmcData(data, locals),
    // author is handled separately because we need to check data.authors before
    //   figuring out nmc's author value
    nmcKeysExceptAuthor = _without(Object.keys(NMC), 'author'),
    ROBOTS = 'robots',
    editorialTagItems = _get(data, 'contentTagItems', []).map(tag => tag.text).join(' ,');

  // save these for SPA to easily be able to create or delete tags without knowing property / names
  // lets us only have to update meta-tags component when adding / removing meta tags in the future
  data.metaTags = [];
  data.unusedTags = [];

  // add content type tag
  if (data.contentType) {
    data.metaTags.push({ property: OG_TYPE, content: data.contentType });
  } else {
    data.unusedTags.push({ type: 'property', property: OG_TYPE });
  }

  // add author tag
  let nmcAuthor = importedNmcData.author;

  if (_get(data, 'authors.length') > 0) {
    const authors = data.authors.map(author => author.text).join(', ');

    if (!hasImportedNmcData) {
      nmcAuthor = data.authors[0].text;
    }

    data.metaTags.push({ property: AUTHOR_NAME, content: authors });
  } else {
    data.unusedTags.push({ type: 'property', property: AUTHOR_NAME });
  }

  // add pub date tag
  if (data.publishDate) {
    data.metaTags.push({ property: PUB_TIME, content: data.publishDate });
  } else if (data.automatedPublishDate) {
    data.metaTags.push({ property: PUB_TIME, content: data.automatedPublishDate });
  } else {
    data.unusedTags.push({ type: 'property', property: PUB_TIME });
  }

  // normalizing categories to be lowercase (sectionFront is usally already lowercase)
  if (data.sectionFront) {
    categories.push(data.sectionFront.toLowerCase());
  }

  if (data.secondarySectionFront) {
    categories.push(data.secondarySectionFront.toLowerCase());
  }

  if (_get(station, 'category')) {
    categories.push(station.category.toLowerCase());
  }

  if (categories.length > 0) {
    data.metaTags.push({ name: CATEGORY, content: categories.join(', ') });
  } else {
    data.unusedTags.push({ type: 'name', name: CATEGORY });
  }

  // add station call letters tag
  if (_get(station, 'callsign')) {
    data.metaTags.push({ name: STATION_CALL_LETTERS, content: station.callsign });
  } else {
    // ON-543: Yes, on every page in www.radio.com unless it's a station page.
    data.metaTags.push({ name: STATION_CALL_LETTERS, content: 'NATL-RC' });
  }

  if (data.noIndexNoFollow) {
    data.metaTags.push({ name: ROBOTS, content: 'noindex, nofollow' });
  } else {
    data.unusedTags.push({ type: 'name', name: ROBOTS });
  }

  // Add 'editorial tags' meta for Google Analytics
  if (editorialTagItems) {
    data.metaTags.push({ name: EDITORIAL_TAGS, content: editorialTagItems });
  } else {
    data.unusedTags.push({ type: 'name', name: EDITORIAL_TAGS });
  }

  // handle nmc tags
  //
  // note we use the 'data-was-imported' attribute to communicate to
  //   'google-ad-manager/client.js' whether the nmc tags were imported.  If
  //   they were, then google ad manager should ignore them when calculating its
  //   own tracking data.  If the tags weren't imported, then they should use
  //   the exact same values as the nmc meta tags.  This attribute is located on
  //   every nmc meta tag because I didn't know where a single queryable
  //   location could be (maybe window.<something> ?).
  if (nmcAuthor) {
    data.metaTags.push({
      name: NMC.author,
      content: nmcAuthor,
      'data-was-imported': hasImportedNmcData
    });
  } else {
    data.unusedTags.push({ type: 'name', name: NMC.author });
  }

  for (const key of nmcKeysExceptAuthor) {
    if (nmcData[key]) {
      data.metaTags.push({
        name: NMC[key],
        content: nmcData[key],
        'data-was-imported': hasImportedNmcData
      });
    } else {
      data.unusedTags.push({ type: 'name', name: NMC[key] });
    }
  }

  // add branch io meta tags
  data.metaTags.push(...await getBranchMetaTags(locals, data, {
    shouldAddAmphoraTimings: true
  }));

  return data;
};

module.exports.save = (ref, data, locals) => {
  if (locals && locals.date) {
    data.automatedPublishDate = locals.date;
  }
  return data;
};


// for testing purposes
module.exports.getNmcData = getNmcData;
