'use strict';

const h = require('highland'),
  { logSuccess, logError } = require('../helpers/log-events'),
  { addSiteAndNormalize, resolveTags } = require('../helpers/transform'),
  { filters, helpers, elastic, subscribe } = require('amphora-search'),
  { isOpForComponents, stripPostProperties } = require('../filters'),
  INDEX = helpers.indexWithPrefix('published-articles', process.env.ELASTIC_PREFIX),
  CONTENT_FILTER = isOpForComponents(['article']);

// Subscribe to the publish stream
subscribe('publish').through(save);
// Subscribe to the save stream
subscribe('save').through(save);

function save(stream) {
  return stream
    .parallel(25)
    .filter(CONTENT_FILTER)
    .filter(filters.isInstanceOp)
    .filter(filters.isPutOp)
    .filter(filters.isPublished)
    .map(helpers.parseOpValue)
    .map(stripPostProperties)
    .through(addSiteAndNormalize(INDEX)) // Run through a pipeline
    .map(filters.filterRefs)
    .flatMap(send)
    .errors(logError)
    .each(logSuccess(INDEX));
}

/**
 * Send the data to Elastic
 *
 * @param  {Array} ops
 * @return {Function}
 */
function send([ op ]) {
  return h(elastic.put(INDEX, op.key, op.value).then(() => op.key));
}

/**
 * Index articles on publish
 * @param  {Object} args
 * @returns {Promise}
 */
module.exports.unpublish = require('../helpers/unpublish')(INDEX, CONTENT_FILTER);
