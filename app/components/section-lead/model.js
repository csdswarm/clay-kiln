'use strict';

const queryService = require('../../services/server/query'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  { isComponent } = require('clayutils'),
  elasticIndex = 'published-articles',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl'
  ],
  maxItems = 3;

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
        const article = Object.assign(item, {
          primaryHeadline: item.overrideTitle || result.primaryHeadline,
          pageUri: result.pageUri,
          urlIsValid: result.urlIsValid,
          canonicalUrl: result.canonicalUrl,
          feedImgUrl: result.feedImgUrl
        });

        if (article.title) {
          article.plaintextTitle = toPlainText(article.title);
        }

        return article;
      });
  }))
    .then((items) => {
      data.items = items;
      data.primaryStoryLabel = data.primaryStoryLabel || data.sectionFront || data.tag;

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

  queryService.onlyWithinThisSite(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  if (data.sectionFront) {
    queryService.addShould(query, { match: { articleType: data.sectionFront }});
  }
  if (data.filterBySecondary) {
    queryService.addMust(query, { match: { secondaryArticleType: data.filterBySecondary }});
  }
  if (data.tag) {
    queryService.addShould(query, { match: { 'tags.normalized': data.tag }});
  }
  queryService.addMinimumShould(query, 1);
  queryService.addSort(query, {date: 'desc'});

  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
  }

  // exclude the curated content from the results
  if (data.items && !isComponent(locals.url)) {
    data.items.forEach(item => {
      if (item.canonicalUrl) {
        cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
        queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
      }
    });
  }

  return queryService.searchByQuery(query)
    .then(function (results) {

      data.articles = data.items.concat(_.take(results, maxItems)).slice(0, maxItems); // show a maximum of maxItems links
      data.primaryStoryLabel = data.primaryStoryLabel || data.sectionFront || data.tag;
      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
