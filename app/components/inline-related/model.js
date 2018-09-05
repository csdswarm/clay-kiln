'use strict';

const queryService = require('../../services/server/query'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  { isComponent } = require('clayutils'),
  tag = require('../tags/model.js'),
  elasticIndex = 'published-articles',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl'
  ],
  maxItems = 2;

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
          canonicalUrl: result.url,
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
  // Always get 1 more than the fill to allow for removal of current page in results
  const query = queryService.newQueryWithCount(elasticIndex, data.fill, locals);
  let cleanUrl;

  if (!data.tag || !locals) {
    return data;
  }

  // Clean based on tags and grab first as we only ever pass 1
  data.tag = tag.clean([{text: data.tag}])[0].text || '';

  queryService.withinThisSiteAndCrossposts(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
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
      const limit = data.fill;

      data.articles = data.items.concat(_.take(results, limit)).slice(0, maxItems); // show a maximum of maxItems links

      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
