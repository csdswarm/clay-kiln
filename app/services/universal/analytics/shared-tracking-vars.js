'use strict';

/**
 * README
 *   I didn't know where to put these nor what to name the file.  Its purpose
 *   is to centralize constants shared between google-ad-manager/client.js
 *   and meta-tags/model.js
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
  doubleclickPageTypeTagArticle: 'article',
  doubleclickPageTypeTagSection: 'sectionfront',
  doubleclickPageTypeTagStationDetail: 'livestreamplayer',
  doubleclickPageTypeTagStationsDirectory: 'stationsdirectory',
  NMC,
  OG_TYPE: 'og:type'
};
