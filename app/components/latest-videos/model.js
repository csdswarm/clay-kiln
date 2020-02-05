'use strict';

const queryService = require('../../services/server/query'),
  _ = require('lodash'),
  recircCmpt = require('../../services/universal/recirc/recirc-cmpt'),
  toPlainText = require('../../services/universal/sanitize').toPlainText,
  { isComponent } = require('clayutils'),
  { unityComponent } = require('../../services/universal/amphora'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'sectionFront',
    'contentType'
  ],
  maxItems = 6;

module.exports = unityComponent({
  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  save(ref, data, locals) {
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
            feedImgUrl: result.feedImgUrl,
            sectionFront: result.sectionFront
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
  },

  /**
   * @param {string} ref
   * @param {object} data
   * @param {object} locals
   * @returns {Promise}
   */
  render(ref, data, locals) {
    const query = queryService.newQueryWithCount(elasticIndex, maxItems);

    let cleanUrl;

    if (!locals) {
      return data;
    }

    queryService.onlyWithinThisSite(query, locals.site);
    queryService.onlyWithTheseFields(query, elasticFields);
    queryService.addMinimumShould(query, 1);
    queryService.addSort(query, { date: 'desc' });
    queryService.addShould(query, {
      nested: {
        path: 'lead',
        query: {
          regexp: {
            'lead._ref': `${process.env.CLAY_SITE_HOST}\/_components\/brightcove\/instances.*`
          }
        }
      }
    });

    // Filter out the following tags
    if (data.filterTags) {
      for (const tag of data.filterTags.map((tag) => tag.text)) {
        queryService.addMustNot(query, { match: { 'tags.normalized': tag } });
      }
    }

    // Filter out the following secondary article type
    if (data.filterSecondarySectionFronts) {
      for (const [secondarySectionFrontFilter, filterOut] of Object.entries(data.filterSecondarySectionFronts)) {
        if (filterOut) {
          queryService.addMustNot(query, { match: { secondarySectionFront: secondarySectionFrontFilter } });
        }
      }
    }

    // exclude the curated content from the results
    if (data.items && !isComponent(locals.url)) {
      for (const item of data.items) {
        if (item.canonicalUrl) {
          cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');
          queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
        }
      }
    }

    return queryService.searchByQuery(query)
      .then(results => ({
        ...data,
        articles: data.items
          .concat(results)
          .slice(0, maxItems) // show a maximum of maxItems links
      }))
      .catch(e => {
        queryService.logCatch(e, ref);
        return data;
      });
  }
});
