'use strict';

const rendererPipeline = require('./renderer-pipeline');

/**
 * Run the feed instance through the transform
 * that is specified in its data. Then consolidate
 * so it can be sent to the renderer.
 *
 * @param  {String} ref
 * @param  {Object} data
 * @param  {Object} locals
 * @return {Promise}
 */
module.exports = (ref, data, locals) => {
  return rendererPipeline(ref, data, locals, 'msn');
};
