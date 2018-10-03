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
      console.log("result", result);
      const content = Object.assign(item, {
        primaryHeadline: item.overrideTitle || result.primaryHeadline,
        pageUri: result.pageUri,
        urlIsValid: result.urlIsValid,
        canonicalUrl: item.url || result.canonicalUrl,
        feedImgUrl: item.overrideImage || result.feedImgUrl,
        teaser: item.overrideTeaser || result.teaser,
        sectionFront: item.overrideSectionFront || result.articleType,
        date: item.overrideDate || result.date,
        lede: item.overrideContentType || result.lead
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
  console.log("data:", data);
  let cleanUrl;
  queryService.withinThisSiteAndCrossposts(query, locals.site);
  queryService.onlyWithTheseFields(query, elasticFields);
  if (data.populateFrom == 'tag') {
    if (!data.tag || !locals) {
      return data;
    }
    console.log("pop from tag, tag: ", data.tag);
     // Clean based on tags and grab first as we only ever pass 1
    data.tag = tag.clean([{text: data.tag}])[0].text || '';
    queryService.addShould(query, { match: { tags: data.tag }});
    queryService.addMinimumShould(query, 1);
  } else if (data.populateFrom == 'section-front') {
    if ((!data.sectionFront && !data.sectionFrontManual) || !locals) {
      return data;
    }
    console.log("pop from sectionFront, sectionFront: ", data.sectionFront, data.sectionFrontManual);
    queryService.addShould(query, { match: { articleType: (data.sectionFront || data.sectionFrontManual) }});
    queryService.addMinimumShould(query, 1);
  } else if (data.populateFrom == 'all') {
    if (!locals) {
      console.log("populate from all -- no locals")
      return data;
    }
    console.log("populate from all")
  }
  queryService.addSort(query, {date: 'desc'});

   // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    cleanUrl = locals.url.split('?')[0].replace('https://', 'http://');
    queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
  }

  return queryService.searchByQuery(query)
    .then(function (results) {
      console.log("results", results);
      data.content = data.items.concat(_.take(results, maxItems)).slice(0, maxItems); // show a maximum of maxItems links
      return data;
    })
    .catch(e => {
      queryService.logCatch(e, ref);
      return data;
    });
};
