'use strict';

const h = require('highland'),
  transforms = require('./transforms'),
  bluebird = require('bluebird');

/**
 * Passes feed's query result through a transform pipeline.
 * @param {string} prefix
 * @param {object} data
 * @param {object} locals
 * @param {function} entryMapper
 * @param {function} mapper
 * @param {function} errorHandler
 * @returns {*}
 */
function rendererPipeline({ prefix, data, locals, mapper, entryMapper = (entry) => entry, errorHandler }) {
  const { transform, results } = data;

  return h(results)
    .flatMap(entry => h(transforms[`${prefix}-${transform}`](entryMapper(entry), locals)))
    .compact() // Give transforms the option to strip a document from response by returning a falsy value (http://highlandjs.org/#compact)
    .collect()
    .map(mapper)
    .toPromise(bluebird)
    .catch(errorHandler);
}

/**
 * Passes in locals so we can strip the www and .com, grab the host and format an s3 url
 * @param {object} locals
 * @returns {String}
*/
function formatS3Path(locals) {
  return `https://s3.amazonaws.com/${locals.site.host.replace('www.', '').replace('.com', '')}-html`;
}

module.exports.rendererPipeline = rendererPipeline;
module.exports.formatS3Path = formatS3Path;
