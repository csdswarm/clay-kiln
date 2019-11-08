'use strict';

const { rendererPipeline } = require('./utils'),
  log = require('../../services/universal/log').setup({ file: __filename, action: 'rss-transform' });

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
  const { meta, attr } = data,
    utmParams = { utmSource: meta.utmSource || 'nym', utmMedium: meta.utmMedium || 'f1' },
    mapper = (feed) => ({ meta: data.meta, feed, attr }),
    entryMapper = (entry) => Object.assign(entry, utmParams),
    errorHandler = (error) => {
      log('error', `Error rendering RSS data - ${error.message}`, {
        error
      });
    };

  return rendererPipeline({
    prefix: 'gnf',
    data,
    locals,
    mapper,
    errorHandler,
    entryMapper
  });
};
