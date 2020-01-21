'use strict';

const { DEFAULT_RADIOCOM_LOGO } = require('../../services/universal/constants'),
  queryService = require('../../services/server/query'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  { isComponent } = require('clayutils'),
  tag = require('../tags/model.js'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'lead',
    'contentType'
  ],
  maxItems = 2,
  applyAspectRatio = imgUrl => {
    imgUrl += imgUrl.includes('?') ? '&' : '?';
    imgUrl += 'crop=16:9';
    return imgUrl;
  };

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
          pageUri: item.url || result.pageUri,
          urlIsValid: result.urlIsValid,
          canonicalUrl: item.url || result.canonicalUrl,
          feedImgUrl: applyAspectRatio(item.overrideImage || result.feedImgUrl || DEFAULT_RADIOCOM_LOGO),
          lead: result.leadComponent
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
  const query = queryService.newQueryWithCount(elasticIndex, data.fill, locals);
  let cleanUrl;

  // items are saved from form, articles are used on FE
  data.articles = data.items;
  data.missingItems = data.articles.some(item => {
    return typeof item.feedImgUrl === 'undefined';
  });

  if (!data.tag || !locals) {
    return data;
  }

  // Clean based on tags and grab first as we only ever pass 1
  data.tag = tag.clean([{ text: data.tag }])[0].text || '';

  queryService.onlyWithinThisSite(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  queryService.addShould(query, { match: { 'tags.normalized': data.tag } });
  queryService.addMinimumShould(query, 1);
  queryService.addSort(query, { date: 'desc' });

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
      const limit = data.fill;

      data.articles = data.items.concat(_.take(results, limit)).slice(0, maxItems); // show a maximum of maxItems links
      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
