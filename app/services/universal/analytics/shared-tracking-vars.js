'use strict';

/**
 * README
 *   This file's purpose is to centralize the constants shared between
 *   google-ad-manager/client.js and meta-tags/model.js.
 */

/**
 * An object with the shape
 * { [tagName]: `nmc:${tagName}` }
 */
const NMC = ['author', 'cat', 'genre', 'market', 'pid', 'station', 'tag']
  .reduce(
    (result, name) => {
      result[name] = 'nmc:' + name;
      return result;
    },
    {}
  );

module.exports = {
  pageTypeTagArticle: 'article',
  pageTypeTagSection: 'sectionfront',
  pageTypeTagStationDetail: 'livestreamplayer',
  pageTypeTagStationsDirectory: 'stationsdirectory',
  NMC,
  OG_TYPE: 'og:type',
  EDITORIAL_TAGS: 'editorial tags'
};
