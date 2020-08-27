'use strict';

const
  { DEFAULT_STATION } = require('./constants'),
  { prettyJSON } = require('./utils'),
  findSyndicatedStation = station => syndications => syndications.find(__.inStation(station)),
  slugify = require('./slugify'),

  __ =  {
    findSyndicatedStation,
    getOrigin: uri => new URL(uri).origin,
    inStation: stationSlug => data => {
      // TODO: revisar este tema.
      /*
        This method is being used both for checking if an article belongs to or is syndicated to a
        station, but with a syndication entry we can't assume it belongs to national when stationSlug
        doesn't exists, as we usually do for RDC original content. So here I'm using the syndication
        source to diferentiate when we are checking for an original content or a syndication.
      */
      if (data.source) {
        return stationSlug === data.stationSlug;
      }

      return stationSlug === (data.stationSlug || DEFAULT_STATION.site_slug);
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
 * @param {boolean} isRdcContent
 * @returns {function}
 */
function syndicationUrlPremap(stationSlug, isRdcContent = false) {
  const
    { findSyndicatedStation, getOrigin, inStation, noContent } = __,
    isInStation = inStation(stationSlug),
    syndicatedStation = findSyndicatedStation(stationSlug);

  return article => {
    const item = { ...article };

    if (!isInStation(item)) {
      if (!isRdcContent && noContent(item.stationSyndication)) {
        throw new Error(`Article is not in target station, and has no stationSyndication: ${prettyJSON(article)}`);
      } else {
        const { syndicatedArticleSlug = '', sectionFront = '' } = syndicatedStation(item.stationSyndication) || {};

        item.canonicalUrl = `${getOrigin(item.canonicalUrl)}${syndicatedArticleSlug}`;
        item.syndicatedLabel = sectionFront;

        delete item.stationSyndication;
      }
    }

    return item;
  };
}

module.exports = {
  _internals: __,
  syndicationUrlPremap,
  findSyndicatedStation,
  generateSyndicationSlug
};
