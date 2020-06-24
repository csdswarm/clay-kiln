'use strict';

const
  { DEFAULT_STATION } = require('./constants'),
  { prettyJSON } = require('./utils'),
  slugify = require('./slugify'),

  __ =  {
    findSyndicatedStation: station => syndications => syndications.find(__.inStation(station)),
    getOrigin: uri => new URL(uri).origin,
    inStation: stationSlug => syndicationEntry => {
      return stationSlug === (syndicationEntry.stationSlug || DEFAULT_STATION.site_slug);
    },
    noContent: value => !Array.isArray(value) || !value.length
  };

/**
 * Composes a syndicatedArticleSlug given the main article slug, the station and the section front(s)
 * @param {string} slug
 * @param {string} stationSlug
 * @param {string?} sectionFront
 * @param {string?} secondarySectionFront
 * @returns {string}
 */
function generateSyndicationSlug(slug, { stationSlug, sectionFront, secondarySectionFront }) {
  return '/' + [
    stationSlug,
    slugify(sectionFront),
    slugify(secondarySectionFront),
    slug
  ].filter(Boolean).join('/');
}

/**
 * for items that were retrieved through syndication/subscription, this replaces the canonicalUrl with
 * the syndicationUrl, so hyperlinks stay on the current site.
 *
 * @param {string} stationSlug
 * @returns {function}
 */
function syndicationUrlPremap(stationSlug) {
  const
    { findSyndicatedStation, getOrigin, inStation, noContent } = __,
    isInStation = inStation(stationSlug),
    syndicatedStation = findSyndicatedStation(stationSlug);

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
  generateSyndicationSlug
};
