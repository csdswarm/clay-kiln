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
     * @param {Object} conditions - object or array that contains query conditions
     * @param {String} conditionType - possible options addShould/addMust/addMustNot
     */
    addCondition = (item, conditions, conditionType) => {
      const { nested, multiQuery, createObj } = conditions;

      if (item) {
        const localQuery = nested ? queryService.newNestedQuery(nested) : query,
          items = item.split(',');

        items.forEach(instance => {
          if (multiQuery) {
            createObj(instance).forEach(cond => {
              if (cond.nested) {
                const newNestedQuery = queryService[conditionType](queryService.newNestedQuery(cond.nested), { match: cond.match });

                queryService[conditionType](localQuery, newNestedQuery);
              } else {
                queryService[conditionType](localQuery, { match: cond.match });
              }
            });
          } else {
            queryService[conditionType](localQuery, { match: createObj(instance)});
          }
          if (conditionType === 'addShould') {
            queryService.addMinimumShould(localQuery, 1);
          }
        });
      }
    },
    /**
     * add filter and exclude conditions to the query
     *
     * @param {String} key
     * @param {Object} conditions
     */
    addFilterAndExclude = (key, conditions) => {
      addCondition(filters[key], conditions, 'addShould');
      addCondition(excludes[key], conditions, 'addMustNot');
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
      station: {
        createObj: station => [
          {
            match: { 'byline.sources.text': station },
            nested: 'byline'
          },
          { match: { stationSyndication: station } },
          { match: { 'stationSyndication.normalized': station } }
        ],
        multiQuery: true
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
  Object.entries(queryFilters).forEach(([key, conditions]) => addFilterAndExclude(key, conditions));

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
