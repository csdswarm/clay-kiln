'use strict';
const queryService = require('../../services/server/query'),
  { isComponent } = require('clayutils'),
  elasticIndex = 'published-content',
  elasticFields = [
    'primaryHeadline',
    'pageUri',
    'canonicalUrl',
    'feedImgUrl',
    'contentType',
    'sectionFront'
  ];

/**
 * @param {number} numResults
 * @param {object} locals
 * @returns {Object}
 */
function buildQuery(numResults, locals) {
  const query = queryService.newQueryWithCount(elasticIndex, numResults);
  
  // grab content from these section fronts
  queryService.addShould(query, [
    {
      match: {
        sectionFront: 'sports'
      }
    },
    {
      match: {
        sectionFront: 'news'
      }
    },
    {
      match: {
        sectionFront: 'music'
      }
    }
  ]);
  // exclude the current page in results
  if (locals.url && !isComponent(locals.url)) {
    const cleanLocalsUrl = locals.url.split('?')[0].replace('https://', 'http://');

    queryService.addMustNot(query, { match: { canonicalUrl: cleanLocalsUrl } });
  }
  queryService.onlyWithTheseFields(query, elasticFields);
  return query;
}

/**
 * @param {object} locals
 * @returns {Promise}
 */
async function buildAndRequestElasticSearch(locals) {
  const
    elasticQuery = buildQuery(10, locals),
    request = await queryService.searchByQuery(elasticQuery);

  return request;
}

/**
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @returns {Promise}
 */
module.exports.render = (ref, data, locals) => {
  return buildAndRequestElasticSearch(locals)
    .then(response => {
      data.items = response.sort(() => Math.random() > 0.5 ? 1 : -1);
      return data;
    })
    .catch(err => {
      queryService.logCatch(err, ref);
      return data;
    });
};
