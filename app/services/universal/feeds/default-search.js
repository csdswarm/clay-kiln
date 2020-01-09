'use strict';
const
  getData = require('./get-data'),
  { getArticleDataAndValidate } = require('../recirc-cmpt'),
  { isComponent } = require('clayutils'),
  {
    matchIgnoreCase,
    matchSimple,
    terms
  } = require('../../server/query'),
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
 * @param {object} data.contentType
 * @param {object[]} data.curatedItems
 * @param {object?} data.filterSecondarySectionFronts
 * @param {object[]|undefined} data.filterTags
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
 * @param {*?} locals.tag
 * @param {string} locals.url
 * @returns {Promise<*[]>}
 */
module.exports.getList = async function (data, locals = {}) {
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
    filter = terms('contentType', contentTypes);
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

    conditions.push(...tags.map(tag => matchSimple('tags.normalized', tag)));
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
    musts.push(matchSimple('authors.normalized', author));
  } else if (populateFrom === 'all-content') {
    if (locals === {}) {
      return;
    }
  }

  mustNots.push(...filterTags.map(({ text }) => matchSimple('tags.normalized', text)));

  getTrueKeys(filterSecondarySectionFronts).forEach(secondarySectionFront => {
    mustNots.push(matchSimple('secondarySectionFront', secondarySectionFront));
    mustNots.push(matchSimple('secondarySectionFront', secondarySectionFront.toLowerCase()));
  });

  // exclude the current page in results
  if (url && !isComponent(url)) {
    const canonicalUrl = canonicalizeUrl(url);

    mustNots.push(matchSimple('canonicalUrl', canonicalUrl));

    if (curatedItems) {
      mustNots.push(...curatedItems
        // not sure canonicalUrl really needs to be canonicalized, but leaving this way for safety
        .map(({ canonicalUrl }) => {
          return canonicalizeUrl(canonicalUrl || '');
        })
        .filter(url => url)
        .map(canonicalUrl => matchSimple('canonicalUrl', canonicalUrl))
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
    locals
  });

  results.forEach(content => content.lead = content.lead[0]._ref.split('/')[2]);

  if (curatedItems) {
    results = curatedItems.concat(results);
  }

  return results.slice(0, pageSize);
};

module.exports.getItemsWithValidation = (ref, curatedItems, locals) => {
  if (curatedItems && curatedItems.length && locals) {
    return Promise.all(curatedItems.map(async item => {
      const result = await getArticleDataAndValidate(ref, item, locals, elasticFields);

      return {
        ...item,
        primaryHeadline: item.overrideTitle || result.primaryHeadline,
        pageUri: result.pageUri,
        urlIsValid: result.urlIsValid,
        canonicalUrl: item.url || result.canonicalUrl,
        sectionFront: item.overrideSectionFront || result.sectionFront,
        date: item.overrideDate || result.date,
        lead: item.overrideContentType || result.leadComponent
      };
    }));
  }
  return [];
};
