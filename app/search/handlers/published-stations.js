'use strict';

const h = require('highland'),
  { logSuccess, logError } = require('../helpers/log-events'),
  { addSiteAndNormalize } = require('../helpers/transform'),
  { filters, helpers, elastic, subscribe } = require('amphora-search'),
  { isOpForComponents } = require('../filters'),
  db = require('../../services/server/db'),
  INDEX = helpers.indexWithPrefix('published-stations', process.env.ELASTIC_PREFIX),
  STATION_FILTER = isOpForComponents(['station-front']);

// Subscribe to the save stream
subscribe('save').through(save);

// Subscribe to the delete stream
subscribe('unpublishPage').through(unpublishPage);

/**
 * Ensures dateModified is always set
 *
 * @param {Object} op
 * @returns {Object}
 */
function setDateModified(op) {
  op.value.dateModified = op.value.dateModified || (new Date()).toISOString();

  return op;
}

function save(stream) {
  return stream
    .parallel(1)
    // only bring back station-front components
    .filter(STATION_FILTER)
    .filter(filters.isInstanceOp)
    .filter(filters.isPutOp)
    .filter(filters.isPublished)
    .map(helpers.parseOpValue) // resolveContent is going to parse, so let's just do that before hand
    .map(setDateModified)
    .through(addSiteAndNormalize(INDEX)) // Run through a pipeline
    .flatten()
    .flatMap(send)
    .errors(logError)
    .each(logSuccess(INDEX));
}

/**
 * Send the data to Elastic
 *
 * @param  {Object} op
 * @return {Function}
 */
function send(op) {
  return h(elastic.update(INDEX, op.key, op.value, false, true).then(() => op.key));
}

/**
 * Remove the data in Elastic
 *
 * @param  {String} key
 * @return {Stream<Promise<String>>}
 */
function removePublished(key) {
  const publishedKey = `${key}@published`;

  return h(elastic.del(INDEX, publishedKey).then(() => publishedKey));
}

/**
 * Gets the main content from a unpublished object
 *
 * @param {Object} op
 * @return {Stream<Promise<String>>}
 */
function getMain(op) {
  return h(db.get(op.uri).then( data => data.main[0]));
}

/**
 * remove the published station from elasticsearch
 *
 * @param {Stream} stream
 * @return {Stream}
 */
function unpublishPage(stream) {
  return stream.flatMap(getMain)
    .flatMap(removePublished)
    .errors(logError)
    .each(logSuccess(INDEX));
}

module.exports.unpublish = require('../helpers/unpublish')(INDEX, STATION_FILTER);
