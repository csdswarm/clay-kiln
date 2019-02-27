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
    // The mapper works on a single item, so we want to wrap the `feed` property in an array because those
    // objects are all under the group of the single article. This is just to match the structure
    // that https://www.npmjs.com/package/xml requires
    mapper = (feed) => ({ meta: data.meta, feed: [ feed ], attr }),
    entryMapper = (entry) => Object.assign(entry, utmParams),
    errorHandler = (error) => {
      log('error', 'Error rendering RSS data', {
        error: error.message
      });
    };

  return rendererPipeline({
    prefix: 'rss',
    data,
    locals,
    mapper,
    errorHandler,
    entryMapper
  });
};
