'use strict';

const queryService = require('../../services/server/query'),
  bluebird = require('bluebird'),
  log = require('../../services/universal/log').setup({
    file: __filename,
    component: 'feeds'
  });

/**
 * Make sure you have an index, transform and meta property on the
 * data
 * @param  {String} uri
 * @param  {Object} data
 * @return {Promise|Object}
 */
module.exports.save = function (uri, data) {
  const { meta } = data;

  if (!data.index || !meta) {
    return bluebird.reject(new Error('Feeds component requires an `index` and `meta` property'));
  }

  if (!meta.renderer) {
    return bluebird.reject(new Error('A feed needs to specify which renderer to use'));
  }

  if (!meta.contentType) {
    return bluebird.reject(new Error('A feed needs to indicate the `Content-Type` a component\'s final data will be served in'));
  }

  if (!meta.fileExtension) {
    return bluebird.reject(new Error('A feed needs a `fileExtension` property to indicate the file type of the scraped feed'));
  }

  return data;
};


/**
 * This render function's pure function is to execute
 * an Elastic query stored in the data.
 *
 * @param  {String} ref
 * @param  {Object} data
 * @param  {Object} locals
 * @return {Promise|Object}
 */
module.exports.render = async (ref, data, locals) => {
  if (!data.index) {
    log('error', 'Feed component requires an `index` and `transform` property in the data');
    return data;
  }

  // If the query param `skipQuery` is present, don't query.
  // Handy for only fetching metadata
  if (locals && locals.skipQuery) {
    return data;
  }

  const { meta } = data,
    filters = locals.filter || {},
    excludes = locals.exclude || {},
    query = queryService(data.index, data.query.query ? data.query.query : null), // Build the appropriate query obj for the env
    /**
     * add a condition to the query
     *
     * @param {String} item - a string of items to apply add to the query condition
     * @param {String} nested - a key to be used as a nested query if needed
     * @param {Function} createObj - a function that take the value and returns the object representation
     * @param {String} condition - possible options addShould/addMust/addMustNot
     */
    addCondition = (item, nested, createObj, condition, multiQuery) => {
      if (item) {
        const localQuery = nested ? queryService.newNestedQuery(nested) : query,
          items = item.split(',');

        items.forEach(instance => {
          if (multiQuery) {
            createObj(instance).forEach(cond => {
              if (cond.nested) {
                const newNestedQuery = queryService[condition](queryService.newNestedQuery(cond.nested), { match: cond.match });

                queryService[condition](localQuery, newNestedQuery);
              } else {
                queryService[condition](localQuery, { match: cond.match });
              }
            });
          } else {
            queryService[condition](localQuery, { match: createObj(instance)});
          }
          if (condition === 'addShould') {
            queryService.addMinimumShould(localQuery, 1);
          }
        });
      }
    },
    /**
     * add filter and exclude conditions to the query
     *
     * @param {String} key
     * @param {String} nested
     * @param {Function} createObj
     */
    addFilterAndExclude = (key, nested, createObj, multiQuery) => {
      addCondition(filters[key], nested, createObj, 'addShould', multiQuery);
      addCondition(excludes[key], nested, createObj, 'addMustNot', multiQuery);
    },
    queryFilters = {
      // vertical (sectionfront) and/or exclude tags
      vertical: { createObj: sectionFront => ({ sectionFront }) },
      // tags
      tag: { createObj: tag => ({ 'tags.normalized': tag }) },
      // subcategory (secondary article type)
      subcategory: { createObj: secondaryArticleType => ({ secondaryArticleType }) },
      // editorial feed (grouped stations)
      editorial: { createObj: editorial => ({ [`editorialFeeds.${editorial}`]: true }) },
      // stations (bool search of nested bylines & stationSyndication fields)
      station: { createObj: station => ([
        { 
          match: { 'byline.sources.text': station },
          nested: 'byline',
        },
        { match: { 'stationSyndication': station }},
        { match: { 'stationSyndication.normalized': station }}
        ]),
        multiQuery: true,
      },
      // categories syndicated to (categorySyndication)
      category: { createObj: categorySyndication => ({ 'categorySyndication.normalized': categorySyndication }) },
      // genres syndicated to (genreSyndication)
      genre: { createObj: genreSyndication => ({ 'genreSyndication.normalized': genreSyndication }) }
    };

  queryService.addSize(query, filters.size ? filters.size : data.query.size);
  queryService.addSort(query, data.query.sort);
  if (data.query._source) {
    queryService.onlyWithTheseFields(query, data.query._source);
  }

  // Loop through all the generic items and add any filter/exclude conditions that are needed
  Object.entries(queryFilters).forEach(([key, { nested, createObj, multiQuery }]) => addFilterAndExclude(key, nested, createObj, multiQuery));

  try {
    if (meta.rawQuery) {
      const results = await queryService.searchByQueryWithRawResult(query);

      data.results = results.hits.hits; // Attach results and return data
      return data;
    } else {
      data.results = await queryService.searchByQuery(query); // Attach results and return data

      return data;
    }
  } catch (e) {
    queryService.logCatch(e, 'feeds.model');
    return data;
  }

};
