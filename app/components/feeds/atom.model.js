'use strict';

const { rendererPipeline } = require('./utils'),
  log = require('../../services/universal/log').setup({ file: __filename, action: 'atom-transform' });

/**
 * Run the feed instance through the transform
 * that is specified in its data. Then consolidate
 * so it can be sent to the renderer.
 *
 * @param {string} ref
 * @param {object} data
 * @return {promise}
 */
module.exports = (ref, data) => {
  const { meta } = data,
    utmParams = { utmSource: meta.utmSource || 'msn', utmMedium: meta.utmMedium || 'f1' },
    mapper = feed => ({ meta, feed }),
    entryMapper = entry => Object.assign(entry, utmParams),
    errorHandler = (error) => {
      log('error', 'Error rendering ATOM data', {
        error: error.message
      });
    };

  return rendererPipeline({
    prefix: 'atom',
    data,
    mapper,
    entryMapper,
    errorHandler
  });
};
