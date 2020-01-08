'use strict';
const {
    matchIgnoreCase,
    matchSimple,
    terms
  } = require('../../server/query'),
  getData = require('./get-data'),
  { isPage } = require('clayutils'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront',
    'date',
    'lead',
    'subHeadline',
    'contentType'
  ],
  canonicalizeUrl = url => url.split('?')[0].replace('https://', 'http://'),
  getTrueKeys = obj => Object.keys(obj).filter(key => obj[key]);

/**
 * Default search for feed components.
 *
 * Based off original in more-content-feed. Focuses more on simply getting the data and assumes most information
 * matches the data from that original model.
 *
 * ---NOTE---
 * Abstracts functionality to determine if the page is dynamic or not as well as where the offset should be if this
 * is more content. If this is integrated into more-content-feed at some point, that part should be handled
 * within more-content-feed and passed into this (remove this NOTE at that time)
 * ----------
 *
 * @param {object} data
 * @param {object?} locals
 * @param {} data.contentType
 * @param data.curatedItems
 * @param {object?} data.filterSecondarySectionFronts
 * @param {object[]?} data.filterTags
 * @param {number} data.pageSize
 * @param {number?} data.offset
 * @param {string} data.populateFrom
 * @param {string?} data.secondarySectionFront
 * @param {string?} data.secondarySectionFrontManual
 * @param {string?} data.sectionFront
 * @param {string?} data.sectionFrontManual
 * @param {*?} data.tag
 * @param {*?} data.tagManual
 * @param {string?} locals.author
 * @param {object?} locals.params
 * @param {string?} locals.secondarySectionFront
 * @param {string?} locals.sectionFront
 * @param {object} locals.site
 * @param {*?} locals.tag
 * @param {string} locals.url
 * @returns {Promise<*[]>}
 */
module.exports = async function (data, locals = {}) {
  const {
      contentType,
      curatedItems,
      filterSecondarySectionFronts = {},
      filterTags = [],
      pageSize,
      offset,
      populateFrom,
      secondarySectionFront,
      secondarySectionFrontManual,
      sectionFront,
      sectionFrontManual,
      tag,
      tagManual
    } = data,
    {
      author: localAuthor,
      params = {},
      secondarySectionFront: localSecondarySectionFront,
      sectionFront: localSectionFront,
      site,
      tag: localTag,
      url
    } = locals,
    {
      author: paramAuthor,
      dynamicAuthor,
      dynamicTag,
      tag: paramTag
    } = params,

    contentTypes = getTrueKeys(contentType),
    fields = elasticFields,
    index = elasticIndex,
    limit = pageSize + 1,
    mustNots = [],
    musts = [],
    shoulds = [],
    conditions = populateFrom === 'section-front-or-tag' ? shoulds : musts;

  let
    filter,
    results = [];

  if (contentTypes.length) {
    filter = terms({ contentType: contentTypes });
  }

  if ([ 'tag', 'section-front-and-tag', 'section-front-or-tag' ].includes(populateFrom)) {
    let tags = localTag || paramTag || dynamicTag || tagManual || tag;

    if (!tags) {
      return;
    }

    if (Array.isArray(tag)) {
      tags = tags.map(({ text }) => text);
    }

    if (typeof tags === 'string') {
      tags = tags.split(',');
    }

    tags = [].concat(tags);

    conditions.concat(tags.map(tag => matchSimple({ 'tags.normalized': tag })));
  }

  if ([ 'section-front', 'section-front-and-tag', 'section-front-or-tag' ].includes(populateFrom)) {
    const primary = sectionFrontManual || localSectionFront,
      secondary = secondarySectionFrontManual || localSecondarySectionFront;

    // NOTE: check for sectionFront and secondarySectionFront (on data) may be a remnant of earlier code that may have
    //       needed more clean up (view logs of more-content-feed model for more info). Leaving for now just to be safe.
    if (!(sectionFront || primary || secondarySectionFront || secondary)) {
      return;
    }

    // if sectionFront and secondarySectionFront checks above are not actually needed, then change to a ternary
    if (secondary) {
      conditions.push(matchIgnoreCase({ secondarySectionFront: secondary }));
    } else if (primary) {
      conditions.push(matchIgnoreCase({ sectionFront: primary }));
    }
  }

  if (populateFrom === 'author') {
    const author = localAuthor || paramAuthor || dynamicAuthor;

    if (!author) {
      return;
    }
    musts.push(matchSimple({ 'authors.normalized': author }));
  } else if (populateFrom === 'all-content') {
    if (locals === {}) {
      return;
    }
  }

  mustNots.concat(filterTags.map(({ text }) => matchSimple({ 'tags.normalized': text })));

  getTrueKeys(filterSecondarySectionFronts).forEach(secondarySectionFront => {
    mustNots.push(matchSimple({ secondarySectionFront }));
    mustNots.push(matchSimple({ secondarySectionFront: secondarySectionFront.toLowerCase() }));
  });

  // exclude the current page in results
  if (url && isPage(url)) {
    const canonicalUrl = canonicalizeUrl(url);

    mustNots.push(matchSimple(canonicalUrl));

    if (curatedItems) {
      mustNots.concat(curatedItems
        // not sure canonicalUrl really needs to be canonicalized, but leaving this way for safety
        .map(({ canonicalUrl }) => canonicalizeUrl(canonicalUrl || ''))
        .filter(String)
        .map(canonicalUrl => matchSimple({ canonicalUrl }))
      );
    }
  }

  results = await getData({
    fields,
    filter,
    index,
    limit,
    mustNots,
    musts,
    offset,
    shoulds,
    site
  });

  results.forEach(content => content.lead = content.lead[0]._ref.split('/')[2]);

  if (curatedItems) {
    results = curatedItems.concat(results);
  }

  return results.slice(0, pageSize);
};
