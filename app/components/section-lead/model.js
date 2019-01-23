'use strict';

const queryService = require('../../services/server/query'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  { isComponent } = require('clayutils'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType'
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
      data.primaryStoryLabel = data.primaryStoryLabel || data.sectionFront;

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
  const query = queryService.newQueryWithCount(elasticIndex, maxItems, locals),
    contentTypes = Object.entries(data.contentType || {})
       .map(([type, isIncluded]) => isIncluded ? type : null)
       .filter((x) => x);
  let cleanUrl;

  // items are saved from form, articles are used on FE
  data.articles = data.items;

  if (!data.sectionFront || !locals) {
    return data;
  }

  if (contentTypes.length) {
    queryService.addFilter(query, { terms: { contentType: contentTypes } });
  }


  queryService.onlyWithinThisSite(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  if (data.filterBySection) {
    queryService.addShould(query, { match: { sectionFront: data.sectionFront }});
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
      data.primaryStoryLabel = data.primaryStoryLabel || data.sectionFront;

      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
