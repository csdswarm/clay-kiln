'use strict';

const queryService = require('../../services/server/query'),
  _ = require('lodash'),
  callout = require('../../services/universal/callout'),
  { isComponent } = require('clayutils'),
  index = 'published-articles',
  fields = [
    'primaryHeadline',
    'plaintextPrimaryHeadline',
    'canonicalUrl',
    'featureTypes',
    'tags',
    'pageUri'
  ];

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = function (ref, data, locals) {
  const query = queryService.newQueryWithCount(index, 6, locals);
  let cleanUrl;

  if (!data.tag || !locals) {
    return data;
  }

  queryService.withinThisSiteAndCrossposts(query, locals.site);
  queryService.onlyWithTheseFields(query, fields);
  queryService.addShould(query, { match: { tags: data.tag }});
  queryService.addMinimumShould(query, 1);
  queryService.addSort(query, {date: 'desc'});

  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
  }

  return queryService.searchByQuery(query)
    .then(function (results) {
      const limit = data.limit || 3;

      data.articles = _.take(results, limit); // show a maximum of <limit> links
      data.hasMore = results.length > limit;

      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
