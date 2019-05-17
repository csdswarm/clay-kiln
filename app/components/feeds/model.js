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
    getVar = (variable) => locals.query[variable].replace(/^\[(.*)]$/, '$1').split(','),
    query = queryService(data.index, data.query.query ? data.query.query : null); // Build the appropriate query obj for the env,

  queryService.addSize(query, locals.query.size ? locals.query.size : data.query.size);
  queryService.addSort(query, data.query.sort);
  if (data.query._source) {
    queryService.onlyWithTheseFields(query, data.query._source);
  }
console.log(locals.query)
  //vertical (sectionfront) and/or exclude tags
  if (locals.query.vertical) {
    const tags = getVar('vertical');

    tags.forEach(vertical => queryService.addShould(query, { match: { sectionFront: vertical }}));
    queryService.addMinimumShould(query, 1);

  }
  // tags
  if (locals.query.tag) {
    const tags = getVar('tag');

    tags.forEach(tag => queryService.addShould(query, { match: { 'tags.normalized': tag }}));
    queryService.addMinimumShould(query, 1);
  }
  // subcategory (secondary article type)
  if (locals.query.subcategory) {
    const subcategories = getVar('subcategory');

    subcategories.forEach(subcategory => queryService.addShould(query, { match: { secondaryArticleType: subcategory }}));
    queryService.addMinimumShould(query, 1);
  }
  // editorial feed (grouped stations)
  if (locals.query.editorial) {
    const editorials = getVar('editorial');

    editorials.forEach(editorial => queryService.addMust(query, { match: { [`editorialFeeds.${editorial}`]: true }}));
    queryService.addMinimumShould(query, 1);
  }
  // stations
  if (locals.query.station) {
    const nestedQuery = queryService.newNestedQuery('byline'),
      stations = getVar('station');

    stations.forEach(station => queryService.addShould(nestedQuery, { match: { 'byline.sources.text': station }}));
    queryService.addMinimumShould(nestedQuery, 1);

    queryService.addMust(query, nestedQuery);
  }

console.log(JSON.stringify(query))
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
