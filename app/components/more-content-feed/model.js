'use strict';
const queryService = require('../../services/server/query'),
  _get = require('lodash/get'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  contentTypeService = require('../../services/universal/content-type'),
  { isComponent } = require('clayutils'),
  loadedIdsService = require('../../services/server/loaded-ids'),
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
  maxItems = 10,
  pageLength = 5;

/**
* @param {string} ref
* @param {object} data
* @param {object} locals
* @returns {Promise}
*/
module.exports.save = async (ref, data, locals) => {
  if (!data.items.length || !locals) {
    return data;
  }

  await Promise.all(data.items.map(async (item) => {
    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
    const searchOpts = {
        includeIdInResult: true,
        shouldDedupeContent: false
      },
      result = await recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields, searchOpts);

    Object.assign(item, {
      uri: result._id,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      subHeadline: item.overrideSubHeadline || result.subHeadline,
      pageUri: result.pageUri,
      urlIsValid: result.urlIsValid,
      canonicalUrl: item.url || result.canonicalUrl,
      feedImgUrl: item.overrideImage || result.feedImgUrl,
      sectionFront: item.overrideSectionFront || result.sectionFront,
      date: item.overrideDate || result.date,
      lead: item.overrideContentType || result.lead
    });
  }));

  return data;
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = async function (ref, data, locals) {
  data.pageLength = _get(locals, 'page')
    ? data.pageLength || pageLength
    : maxItems;

  // if we're on a page other than 0 then we want to query pageLength number of
  //   items.  If we're on the first page then we want to query that number
  //   minus the number of curated items we already have.
  const count = _get(locals, 'page')
      ? data.pageLength
      : data.pageLength - data.items.length,
    query = queryService.newQueryWithCount(elasticIndex, count, locals),
    contentTypes = contentTypeService.parseFromData(data),
    searchOpts = {
      shouldDedupeContent: true,
      transformResult: (formattedResult, rawResult) => {
        return {
          result: formattedResult,
          moreContent: formattedResult.length < rawResult.hits.total
        };
      }
    },
    curatedIds = data.items.filter(item => item.uri).map(item => item.uri);
  let cleanUrl;

  await loadedIdsService.appendToLocalsAndRedis(curatedIds, locals);

  data.initialLoad = false;

  if (contentTypes.length) {
    queryService.addFilter(query, { terms: { contentType: contentTypes } });
  }

  queryService.onlyWithinThisSite(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  if (!_get(locals, 'page')) {
    data.initialLoad = true;

    // Default to loading 30 articles, which usually works out to 4 pages
    data.lazyLoads = Math.max(Math.ceil((30 - data.pageLength) / data.pageLength), 0);
  }

  if (data.populateFrom === 'tag') {
    // If we're publishing for a dynamic page, alert the template
    data.dynamicTagPage = false;

    // Clean based on tags and grab first as we only ever pass 1
    // If we set a tag override the path
    data.tag = data.tagManual || data.tag;

    // Check if we are on a tag page and override the above
    if (_get(locals, 'tag')) {
      // This is from load more on a tag page
      data.tag = locals.tag;
    } else if (_get(locals, 'params.tag')) {
      // This is from a tag page but do not override a manually set tag
      data.tag = data.tag || locals.params.tag;
    } else if (_get(locals, 'params.dynamicTag')) {
      // This is from a tag page
      data.tag = locals.params.dynamicTag;
      data.dynamicTagPage = true;
    }

    if (!data.tag) {
      return data;
    }

    // normalize tag array (based on simple list input)
    if (Array.isArray(data.tag)) {
      data.tag = data.tag.map(tag => tag.text);
    }

    // split comma seperated tags (for load-more get queries)
    if (typeof data.tag == 'string' && data.tag.indexOf(',') > -1) {
      data.tag = data.tag.split(',');
    }

    // Handle querying an array of tags
    if (Array.isArray(data.tag)) {
      for (let tag of data.tag) {
        queryService.addShould(query, { match: { 'tags.normalized': tag }});
      }
    } else {
      // No need to clean the tag as the analyzer in elastic handles cleaning
      queryService.addShould(query, { match: { 'tags.normalized': data.tag }});
    }

    queryService.addMinimumShould(query, 1);
  } else if (data.populateFrom === 'author') {
    // Check if we are on an author page and override the above
    if (locals && locals.author) {
      // This is from load more on an author page
      data.author = locals.author;
    } else if (locals && locals.params) {
      // This is from an author page
      data.author = locals.params.dynamicAuthor;
    }

    if (!data.author) {
      return data;
    }

    // No need to clean the author as the analyzer in elastic handles cleaning
    queryService.addShould(query, { match: { 'authors.normalized': data.author }});
    queryService.addMinimumShould(query, 1);
  } else if (data.populateFrom === 'section-front') {
    if (!data.sectionFront && !data.sectionFrontManual &&
    !data.secondarySectionFront && !data.secondarySectionFrontManual
    || !locals) {
      return data;
    }
    if (locals.secondarySectionFront || data.secondarySectionFrontManual) {
      const secondarySectionFront = data.secondarySectionFrontManual || locals.secondarySectionFront;

      queryService.addShould(query, { match: { secondarySectionFront: secondarySectionFront }});
      queryService.addShould(query, { match: { secondarySectionFront: secondarySectionFront.toLowerCase() }});
      queryService.addMinimumShould(query, 1);
    } else if (locals.sectionFront || data.sectionFrontManual) {
      const sectionFront = data.sectionFrontManual || locals.sectionFront;

      queryService.addShould(query, { match: { sectionFront: sectionFront }});
      queryService.addShould(query, { match: { sectionFront: sectionFront.toLowerCase() }});
      queryService.addMinimumShould(query, 1);
    }
  } else if (data.populateFrom === 'all-content') {
    if (!locals) {
      return data;
    }
  }

  queryService.addSort(query, {date: 'desc'});

  // Filter out the following tags
  if (data.filterTags) {
    for (const tag of data.filterTags.map((tag) => tag.text)) {
      queryService.addMustNot(query, { match: { 'tags.normalized': tag }});
    }
  }

  // Filter out the following secondary article type
  if (data.filterSecondarySectionFronts) {
    Object.entries(data.filterSecondarySectionFronts).forEach((secondarySectionFront) => {
      let [ secondarySectionFrontFilter, filterOut ] = secondarySectionFront;

      if (filterOut) {
        queryService.addMustNot(query, { match: { secondarySectionFront: secondarySectionFrontFilter }});
        queryService.addMustNot(query, { match: { secondarySectionFront: secondarySectionFrontFilter.toLowerCase() }});
      }
    });
  }

  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
  }

  try {
    const { result, moreContent } = await queryService.searchByQuery(query, locals, searchOpts);

    result.forEach(content => {
      content.lead = content.lead[0]._ref.split('/')[2];
    });

    // "more content" button passes page query param - render more content and return it
    data.moreContent = moreContent;

    // On initial load we need to prepend curated items onto the list, otherwise skip
    data.content = data.initialLoad
      ? data.items.concat(result)
      : result;
  } catch (e) {
    queryService.logCatch(e, ref);
  }

  return data;
};
