'use strict';

const
  { DEFAULT_STATION } = require('./constants'),
  { prettyJSON } = require('./utils'),
  findSyndicatedStation = station => syndications => syndications.find(__.inStation(station)),
  __ =  {
    findSyndicatedStation,
    getOrigin: uri => new URL(uri).origin,
    inStation: stationSlug => syndicationEntry => {
      return stationSlug === (syndicationEntry.stationSlug || DEFAULT_STATION.site_slug);
    },
    noContent: value => !Array.isArray(value) || !value.length
  };

/**
 * for items that were retrieved through syndication/subscription, this replaces the canonicalUrl with
 * the syndicationUrl, so hyperlinks stay on the current site.
 *
 * @param {object} locals
 * @param {object} locals.station
 * @returns {function}
 */
function syndicationUrlPremap({ station }) {
  const
    { findSyndicatedStation, getOrigin, inStation, noContent } = __,
    isInStation = inStation(station),
    syndicatedStation = findSyndicatedStation(station);

  return article => {
    const item = { ...article };

    if (!isInStation(item)) {
      if (noContent(item.stationSyndication)) {
        throw new Error(`Article is not in target station, and has no stationSyndication: ${prettyJSON(article)}`);
      } else {
        const { syndicatedArticleSlug = '' } = syndicatedStation(item.stationSyndication) || {};

        item.canonicalUrl = `${getOrigin(item.canonicalUrl)}${syndicatedArticleSlug}`;
        delete item.stationSyndication;
      }
    }

    return item;
  };
}

module.exports = {
  _internals: __,
  syndicationUrlPremap,
  findSyndicatedStation
};
