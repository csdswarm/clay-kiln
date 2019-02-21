'use strict';

const h = require('highland'),
  { logSuccess, logError } = require('../helpers/log-events'),
  { addSiteAndNormalize } = require('../helpers/transform'),
  { filters, helpers, elastic, subscribe } = require('amphora-search'),
  { isOpForComponents, stripPostProperties } = require('../filters'),
  ioredis = require('ioredis'),
  redis = new ioredis(process.env.REDIS_HOST),
  INDEX = helpers.indexWithPrefix('published-content', process.env.ELASTIC_PREFIX),
  CONTENT_FILTER = isOpForComponents(['article', 'gallery']);

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
    .map((param) => {
      if (param.key.indexOf('article') >= 0) {
        let value = JSON.parse(param.value),
          content = value.content;

        value.content = content.map((component) => {
          return {
            _ref: component._ref,
            data: 'Test'
          };
        });
        value.headline = 'Shawn' + value.headline;
        param.value = JSON.stringify(value);
      }
      return param;
    })
    .map(helpers.parseOpValue)
    .map(stripPostProperties)
    .through(addSiteAndNormalize(INDEX)) // Run through a pipeline
    .tap(i => {
      console.log('\n\nThis is the value about to be sent to elastic');
      console.log(i[0].value);
      console.log(i[0].value.content);
      console.log('\n\n')
    })
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
  return h(elastic.update(INDEX, op.key, op.value, false, true).then(() => op.key));
}

/**
 * Index articles/galleries on publish
 * @param  {Object} args
 * @returns {Promise}
 */
module.exports.unpublish = require('../helpers/unpublish')(INDEX, CONTENT_FILTER);
