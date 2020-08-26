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
async function rendererPipeline(ref, data, locals, prefix) {
  const { meta, attr, transform, results } = data,
    generateLink = makeGenerateLink(locals || {}),
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

/**
 * Ensures the station feed params make sense and throws an error otherwise.
 *
 * @param {object} locals
 */
function validateStationFeed(locals) {
  const {
    andFilter = {},
    filter = {},
    orFilter = {}
  } = locals;

  let errMsg;

  if (!locals.isStationFeed && !filter.isStationFeed) {
    return;
  }

  if (!andFilter.station && !filter.station) {
    errMsg = 'station feeds require andFilter.station (or filter.station, but'
      + " that's deprecated)";
  }

  if (orFilter.station) {
    errMsg = 'you cannot declare orFilter.station since a station feed requires'
      + ' a single station';
  }

  if (
    (andFilter.station && filter.station)
    || Array.isArray(andFilter.station)
    || Array.isArray(filter.station)
  ) {
    errMsg = 'you cannot declare multiple station filters';
  }

  if (errMsg) {
    throw new Error(errMsg);
  }
}

/**
 * Returns a function which assigns 'link' to the entry dependent on whether
 *   we're rendering a station feed
 *
 * @param {object} locals
 * @returns {function}
 */
function makeGenerateLink(locals) {
  validateStationFeed(locals);

  const {
      filter = {},
      andFilter = {}
    } = locals,
    // filter.isStationFeed and filter.station are deprecated.  'Why' is
    //   explained in the commit message
    isStationFeed = locals.isStationFeed || filter.isStationFeed,
    stationCallsign = (filter.station || andFilter.station || '').toLowerCase();

  return entry => {
    entry.link = entry.canonicalUrl;

    if (!isStationFeed || !stationCallsign) {
      return entry;
    }

    const syndicationEntry = entry.stationSyndication.find(obj => {
        return obj.callsign.toLowerCase() === stationCallsign;
      }),
      contentIsSyndicated = !!syndicationEntry;

    if (contentIsSyndicated) {
      const link = new URL(entry.canonicalUrl);

      link.pathname = syndicationEntry.syndicatedArticleSlug;
      entry.link = link.toString();
    }

    return entry;
  };
}

module.exports = rendererPipeline;
