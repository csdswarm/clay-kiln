'use strict';
const queryService = require('../../services/server/query'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  { isComponent } = require('clayutils'),
  tag = require('../tags/model.js'),
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
  maxItems = 10;

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
  const query = queryService.newQueryWithCount(elasticIndex, maxItems, locals);
  let cleanUrl;

  queryService.withinThisSiteAndCrossposts(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  if (locals && locals.page) {
    // after the first 10 items, show N more at a time (pageLength defaults to 5)
    // page = 1 would show items 10-15, page = 2 would show 15-20, page = 0 would show 1-10
    // we return N + 1 items so we can let the frontend know if we have more data.
    const skip = maxItems + (parseInt(locals.page) - 1) * data.pageLength;

    queryService.addOffset(query, skip);
    queryService.addSize(query, data.pageLength + 1);
  }
  if (data.populateFrom == 'tag') {
    if (!data.tag || !locals) {
      return data;
    }
    // Clean based on tags and grab first as we only ever pass 1
    data.tag = tag.clean([{text: data.tag}])[0].text || '';
    queryService.addShould(query, { match: { tags: data.tag }});
    queryService.addMinimumShould(query, 1);
  } else if (data.populateFrom == 'section-front') {
    if (!data.sectionFront && !data.sectionFrontManual || !locals) {
      return data;
    }
    queryService.addShould(query, { match: { articleType: data.sectionFrontManual || data.sectionFront }});
    queryService.addMinimumShould(query, 1);
  } else if (data.populateFrom == 'all') {
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
      data.content = data.items.concat(_.take(results, maxItems)).slice(0, maxItems); // show a maximum of maxItems links
      data.rawQueryResults = results.slice(0, data.pageLength);
      data.moreResults = results.length > data.pageLength;
      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
