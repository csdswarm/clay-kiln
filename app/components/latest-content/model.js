'use strict';
const queryService = require('../../services/server/query'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  {
    isComponent
  } = require('clayutils'),
  // tag = require('../tags/model.js'),
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
  if (!data.entertainmentItems.length || !locals) {
    return data;
  }
  return Promise.all(_.map(data.entertainmentItems, (item) => {
    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
    return recircCmpt.getArticleDataAndValidate(ref, item, locals, elasticFields)
      .then((result) => {
        const article = Object.assign(item, {
          primaryHeadline: item.overrideTitle || result.primaryHeadline,
          pageUri: result.pageUri,
          urlIsValid: result.urlIsValid,
          canonicalUrl: item.url || result.canonicalUrl,
          feedImgUrl: item.overrideImage || result.feedImgUrl
        });

        return article;
      });
  }))
    .then((entertainmentItems) => {
      data.entertainmentItems = entertainmentItems;
      return data;
    })
    .then((sportsItems) => {
      data.sportsItems = sportsItems;
      return data;
    })
    .then((newsItems) => {
      data.newsItems = newsItems;
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

  const entertainmentQuery = queryService.newQueryWithCount(elasticIndex, maxItems, locals),
    sportsQuery = queryService.newQueryWithCount(elasticIndex, maxItems, locals),
    newsQuery = queryService.newQueryWithCount(elasticIndex, maxItems, locals);

  let cleanUrl;

  // Entertainment
  queryService.withinThisSiteAndCrossposts(entertainmentQuery, locals.site);
  queryService.onlyWithTheseFields(entertainmentQuery, elasticFields);
  queryService.addShould(entertainmentQuery, {
    match: {
      articleType: 'entertainment'
    }
  });

  queryService.addMinimumShould(entertainmentQuery, 1);
  queryService.addSort(entertainmentQuery, {
    date: 'desc'
  });

  // Sports

  queryService.withinThisSiteAndCrossposts(sportsQuery, locals.site);
  queryService.onlyWithTheseFields(sportsQuery, elasticFields);
  queryService.addShould(sportsQuery, {
    match: {
      articleType: 'sports'
    }
  });

  queryService.addMinimumShould(sportsQuery, 1);
  queryService.addSort(sportsQuery, {
    date: 'desc'
  });

  // News

  queryService.withinThisSiteAndCrossposts(newsQuery, locals.site);
  queryService.onlyWithTheseFields(newsQuery, elasticFields);
  queryService.addShould(newsQuery, {
    match: {
      articleType: 'news'
    }
  });

  queryService.addMinimumShould(newsQuery, 1);
  queryService.addSort(newsQuery, {
    date: 'desc'
  });

  // exclude the current page in results
  // if (locals.url && !isComponent(locals.url)) {
  //   cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
  //   queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
  // }

  // exclude the curated content from the results

  if (data.entertainmentItems && !isComponent(locals.url)) {
    data.entertainmentItems.forEach(item => {
      cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
      queryService.addMustNot(entertainmentQuery, {
        match: {
          canonicalUrl: cleanUrl
        }
      });
      queryService.addMustNot(sportsQuery, {
        match: {
          canonicalUrl: cleanUrl
        }
      });
      queryService.addMustNot(newsQuery, {
        match: {
          canonicalUrl: cleanUrl
        }
      });
    });
  }

  return queryService.searchByQuery(entertainmentQuery)
    .then(function (results) {
      data.entertainmentArticles = data.entertainmentItems.concat(_.take(results, maxItems)).slice(0, maxItems); // show a maximum of maxItems links
      queryService.searchByQuery(sportsQuery)
        .then(function (results) {
          data.sportsArticles = data.sportsItems.concat(_.take(results, maxItems)).slice(0, maxItems); // show a maximum of maxItems links
          queryService.searchByQuery(newsQuery)
            .then(function (results) {
              data.newsArticles = data.newsItems.concat(_.take(results, maxItems)).slice(0, maxItems); // show a maximum of maxItems links
            })
            .catch(e => {
              queryService.logCatch(e, ref);
              return data;
            });
        })
        .catch(e => {
          queryService.logCatch(e, ref);
          return data;
        });
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
