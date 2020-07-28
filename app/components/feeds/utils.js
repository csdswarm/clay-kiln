'use strict';

const h = require('highland'),
  bluebird = require('bluebird'),
  transforms = require('./transforms'),
  log = require('../../services/universal/log').setup({ file: __filename });

/**
 * Passes feed's query result through a transform pipeline.
 *
 * @param {string} ref
 * @param {object} data
 * @param {object} locals
 * @param {string} prefix
 * @returns {*}
 */
function rendererPipeline(ref, data, locals, prefix) {
  const { meta, attr, transform, results } = data,
    generateLink = makeGenerateLink(locals.filter || {}),
    utmParams = { utmSource: meta.utmSource || 'nym', utmMedium: meta.utmMedium || 'f1' },
    mapper = (feed) => ({ meta: data.meta, feed, attr }),
    entryMapper = (entry) => Object.assign(generateLink(entry), utmParams),
    errorHandler = (error) => {
      log('error', 'Error rendering feed data', error);
    };

  return h(results)
    .flatMap(entry => h(Promise.resolve(transforms[`${prefix}-${transform}`](entryMapper(entry), locals))))
    .compact() // Give transforms the option to strip a document from response by returning a falsy value (http://highlandjs.org/#compact)
    .collect()
    .map(mapper)
    .toPromise(bluebird)
    .catch(errorHandler);
}

function makeGenerateLink({ isStationFeed, station }) {
  const stationCallsign = station.toLowerCase();

  return entry => {
    entry.link = entry.canonicalUrl;

    if (stationCallsign && isStationFeed) {
      const syndicationEntry = entry.stationSyndication.find(obj => {
          return obj.callsign.toLowerCase() === stationCallsign;
        }),
        contentIsSyndicated = !!syndicationEntry;

      if (contentIsSyndicated) {
        const link = new URL(entry.canonicalUrl);

        link.pathname = syndicationEntry.syndicatedArticleSlug;
        entry.link = link.toString();
      }
    }

    return entry;
  };
}

module.exports = {
  rendererPipeline
};
