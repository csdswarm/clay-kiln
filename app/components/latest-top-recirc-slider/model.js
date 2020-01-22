'use strict';
const queryService = require('../../services/server/query'),
  { isComponent } = require('clayutils'),
  recircCmpt = require('../../services/universal/recirc-cmpt'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ],
  maxResults = 10;

/**
 * @param {number} numResults
 * @param {object} locals
 * @param {array} items
 * @returns {Object}
 */
function buildQuery(numResults, locals, items) {
  const query = queryService.newQueryWithCount(elasticIndex, numResults, locals),
    // grab content from these section fronts from the env
    sectionFronts = process.env.SECTION_FRONTS.split(',');

  // add sorting
  queryService.addSort(query, { date: 'desc' });
  // map the sectionFronts to should matches
  queryService.addShould(query, sectionFronts.map(sf => {
    return {
      match: {
        sectionFront: sf
      }
    };
  }));
  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    const cleanLocalsUrl = locals.url.split('?')[0].replace('https://', 'http://');

    queryService.addMustNot(query, { match: { canonicalUrl: cleanLocalsUrl } });
  }
  // exclude the curated content from the results
  if (items && !isComponent(locals.url)) {
    items.forEach(item => {
      if (item.canonicalUrl) {
        const cleanUrl = item.canonicalUrl.split('?')[0].replace('https://', 'http://');

        queryService.addMustNot(query, { match: { canonicalUrl: cleanUrl } });
      }
    });
  }
  queryService.onlyWithTheseFields(query, elasticFields);
  return query;
}

/**
 * @param {object} locals
 * @param {array} items
 * @returns {Promise}
 */
async function buildAndRequestElasticSearch(locals, items) {
  const
    elasticQuery = buildQuery(maxResults, locals, items),
    searchOpts = { shouldDedupeContent: true },
    elasticQueryResponseItems = await queryService.searchByQuery(
      elasticQuery,
      locals,
      searchOpts
    );

  return elasticQueryResponseItems;
}

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = (ref, data, locals) => {
  const curatedIds = data.items.map(anItem => anItem.uri);

  locals.loadedIds = locals.loadedIds.concat(curatedIds);

  return buildAndRequestElasticSearch(locals, data.items)
    .then(elasticQueryResponseItems => {
      data.articles = data.items.concat(elasticQueryResponseItems.slice(0, maxResults)).slice(0, maxResults); // show a maximum of maxItems links
      return data;
    })
    .catch(err => {
      queryService.logCatch(err, ref);
      return data;
    });
};

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.save = async (ref, data, locals) => {
  if (!data.items.length || !locals) {
    return data;
  }
  data.items = await Promise.all(data.items.map(async (item) => {
    item.urlIsValid = item.ignoreValidation ? 'ignore' : null;
    const searchOpts = {
        includeIdInResult: true,
        shouldDedupeContent: false
      },
      result = await recircCmpt.getArticleDataAndValidate(
        ref,
        item,
        locals,
        elasticFields,
        searchOpts
      );

    return  {
      ...item,
      uri: result._id,
      primaryHeadline: item.overrideTitle || result.primaryHeadline,
      pageUri: result.pageUri,
      urlIsValid: result.urlIsValid,
      canonicalUrl: item.url || result.canonicalUrl,
      feedImgUrl: item.overrideImage || result.feedImgUrl ,
      sectionFront: result.sectionFront
    };
  }));

  return data;
};
