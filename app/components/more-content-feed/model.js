'use strict';
const queryService = require('../../services/server/query'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  { isComponent } = require('clayutils'),
  elasticIndex = 'published-articles',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'teaser',
    'articleType',
    'date',
    'lead'
  ],
  maxItems = 10,
  pageLength = 5;

/**
* @param {string} ref
* @param {object} data
* @param {object} locals
* @returns {Promise}
*/
module.exports.save = (ref, data, locals) => {
  if (!data.items.length || !locals) {
    return data;
  }
  return Promise.all(_.map(data.items, (item) => {
    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
    return recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields)
      .then((result) => {
        const content = Object.assign(item, {
          primaryHeadline: item.overrideTitle || result.primaryHeadline,
          pageUri: result.pageUri,
          urlIsValid: result.urlIsValid,
          canonicalUrl: item.url || result.canonicalUrl,
          feedImgUrl: item.overrideImage || result.feedImgUrl,
          teaser: item.overrideTeaser || result.teaser,
          articleType: item.overrideSectionFront || result.articleType,
          date: item.overrideDate || result.date,
          lead: item.overrideContentType || result.lead
        });

        return content;
      });
  }))
    .then((items) => {
      data.items = items;
      return data;
    });
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = function (ref, data, locals) {
  // take 1 more article than needed to know if there are more
  const query = queryService.newQueryWithCount(elasticIndex, maxItems + 1);
  let cleanUrl;

  data.initialLoad = false;

  queryService.onlyWithinThisSite(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  if (locals && locals.page) {
    /* after the first 10 items, show N more at a time (pageLength defaults to 5)
     * page = 1 would show items 10-15, page = 2 would show 15-20, page = 0 would show 1-10
     * we return N + 1 items so we can let the frontend know if we have more data.
     */
    if (!data.pageLength) {
      data.pageLength = pageLength;
    }

    const skip = maxItems + (parseInt(locals.page) - 1) * data.pageLength;

    queryService.addOffset(query, skip);
  } else {
    data.pageLength = maxItems;
    data.initialLoad = true;
  }

  if (data.populateFrom == 'tag') {
    // If we're publishing for a dynamic page, alert the template
    data.dynamicTagPage = false;

    // Clean based on tags and grab first as we only ever pass 1
    // If we set a tag override the path
    data.tag = data.tagManual || data.tag;

    // Check if we are on a tag page and override the above
    if (locals && locals.tag) {
      // This is from load more on a tag page
      data.tag = locals.tag;
    } else if (locals && locals.params && locals.params.tag) {
      // This is from a tag page but do not override a manually set tag
      data.tag = data.tag || locals.params.tag;
    } else if (locals && locals.params && locals.params.dynamicTag) {
      // This is from a tag page
      data.tag = locals.params.dynamicTag;
      data.dynamicTagPage = true;
    }

    if (!data.tag) {
      return data;
    }

    // No need to clean the tag as the analyzer in elastic handles cleaning
    queryService.addShould(query, { match: { 'tags.normalized': data.tag }});
    queryService.addMinimumShould(query, 1);
  } else if (data.populateFrom == 'author') {
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
  } else if (data.populateFrom == 'section-front') {
    if (!data.sectionFront && !data.sectionFrontManual || !locals) {
      return data;
    }
    queryService.addShould(query, { match: { articleType: data.sectionFrontManual || data.sectionFront }});
    queryService.addMinimumShould(query, 1);
  } else if (data.populateFrom == 'all-content') {
    if (!locals) {
      return data;
    }
  }
  queryService.addSort(query, {date: 'desc'});

  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
  }

  // exclude the curated content from the results
  if (data.items && !isComponent(locals.url)) {
    // this can be a bug when items dont have canonical urls
    data.items.filter((item) => item.canonicalUrl).forEach(item => {
      cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
      queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
    });
  }

  return queryService.searchByQuery(query)
    .then(function (results) {
      results = results.map(content => {
        content.lead = content.lead[0].split('/')[2];
        return content;
      });

      // "more content" button passes page query param - render more content and return it
      data.moreContent = results.length > data.pageLength;

      // On initial load we need to append curated items onto the list, otherwise skip
      if (data.initialLoad) {
        data.content = data.items.concat(results.slice(0, data.pageLength)).slice(0, data.pageLength); // show a maximum of pageLength links
      } else {
        data.content = results.slice(0, data.pageLength); // show a maximum of pageLength links
      }

      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
