'use strict';

/**
 * NOTE
 *   When this was written, all the logic was extracted from
 *   google-ad-manager/client.js because it needed to be shared with
 *   meta-tags/model.js.  Just keep that context in mind if the logic doesn't
 *   make sense on its own.
 */

const _get = require('lodash/get'),
  _startsWith = require('lodash/startsWith'),
  urlParse = require('url-parse'),
  { stripOuterSlashes } = require('../pathname-utils'),
  {
    pageTypeTagArticle,
    pageTypeTagSection,
    pageTypeTagStationDetail,
    pageTypeTagStationsDirectory
  } = require('./shared-tracking-vars'),
  pageTypeHomepage = 'homepage',
  pageTypeSectionFrontTag = 'sectionfront',
  pageTypeTagAuthor = 'authors',
  pageTypeTagTag = 'tag',
  setOfCategories = new Set(['music', 'news-talk', 'sports']),
  // these are in relation to the 'page' field of universal/get-targeting-page-data.js
  ContentPages = new Set(['article', 'vgallery', 'events', 'contests']),
  homepageOrStationFront = new Set(['homepage', 'stationFront']),
  rdcOrStationSectionFront = new Set(['sectionFront', 'stationSectionFront']),
  /**
   * stationsDirectory utilities assume the pathname passes `isStationsDirectory`
   */
  stationsDirectory = {
    /**
     * Returns the category if one exists otherwise an empty string
     * @param {string} pathname
     * @returns {string}
     */
    getCategory: (pathname) => {
      const result = pathname.match(/^\/stations\/([^/]+)/),
        category = _get(result, '[1]');

      return setOfCategories.has(category)
        ? category
        : '';
    },
    /**
     * Returns the genre if one exists otherwise an empty string
     * @param {string} pathname
     * @returns {string}
     */
    getGenre: (pathname) => {
      const category = stationsDirectory.getCategory(pathname),
        result = category !== 'music'
          ? category
          : stripOuterSlashes(pathname).replace('stations/music/', '');

      return result;
    }
  };

/**
 * Throws when currentStation is falsey to ensure a sensible error is thrown on
 * invalid input.
 *
 * @param {object} currentStation - the object on locals.station
 */
function assertCurrentStation(currentStation) {
  if (!currentStation) {
    throw new Error("'currentStation' must exist for station detail pages");
  }
}

/**
 * @typedef {object} FromPathnameApi
 * @property {function(object):string} getCategory
 * @property {function(object):string} getGenre
 * @property {function(object);string} getPageId
 * @property {function():string} getPathname
 * @property {function(object):string[]} getTags
 * @property {function():boolean} isAuthorPage
 * @property {function():boolean} isHomepage
 * @property {function():boolean} isStationDetail
 * @property {function():boolean} isStationsDirectory
 * @property {function():boolean} isTopicPage
 */

/**
 * This utility is meant to encapsulate various logic to extract info from a
 *   pathname.  I originally needed it to extract which station category the
 *   user visited.  This logic needed to be shared between google-ad-manager on
 *   the client as well as in meta-tags/model.js.
 *
 * @param {object} obj - pathname xor a url must be passed
 * @param {string} [obj.pathname] - a url pathname
 * @param {string} [obj.url] - a url which we'll use to parse the pathname
 * @returns {FromPathnameApi}
 */
module.exports = ({ pathname, url } = {}) => {
  if (pathname && url) {
    throw new Error("You cannot pass both 'pathname' and 'url'.");
  }
  if (!pathname && pathname !== '' && !url) {
    throw new Error("either 'pathname' or 'url' must be passed.");
  }

  if (url) {
    pathname = urlParse(url).pathname;
  }

  // we have a pathname now woo

  const api = {
    /**
     * Returns the category if one exists, otherwise an empty string
     * @param {object} [currentStation] - the object found on locals.station
     * @returns {string}
     */
    getCategory: (currentStation) => {
      if (api.isStationsDirectory()) {
        return stationsDirectory.getCategory(pathname);
      } else if (api.isStationDetail()) {
        assertCurrentStation(currentStation);
        return currentStation.category.toLowerCase();
      }
    },
    /**
     * Returns the genre if one exists, otherwise an empty string
     * @param {object} [currentStation] - the object found on locals.station
     * @returns {string}
     */
    getGenre: (currentStation) => {
      if (api.isStationsDirectory()) {
        return stationsDirectory.getGenre(pathname);
      } else if (api.isStationDetail()) {
        assertCurrentStation(currentStation);
        const category = currentStation.category.toLowerCase(),
          hasGenre = (category === 'music') && currentStation.genre_name.length;

        return hasGenre
          ? currentStation.genre_name[0].toLowerCase()
          : category;
      }
    },
    /**
     * @param {object} pageData - the result of universal/get-targeting-page-data.js
     * @returns {string}
     */
    getPageId: (pageData = {}) => {
      const { page, pageName } = pageData;
      let pageId = pageName;

      if (homepageOrStationFront.has(page)) {
        pageId = pageTypeHomepage;
      } else if (rdcOrStationSectionFront.has(page)) {
        pageId = pageTypeSectionFrontTag + '_' + pageName;
      } else if (ContentPages.has(page)) {
        pageId = pageName + '_' + stripOuterSlashes(pathname).split('/').pop();
      } else if (page === 'topicPage') {
        pageId = pageTypeTagTag + '_' + pageName;
      }

      return pageId;
    },
    /**
     * Returns the internal 'pathname'
     * @returns {string}
     */
    getPathname: () => {
      return pathname;
    },
    /**
     * @param {object} pageData - the result of universal/get-page-data.js
     * @param {string[]} contentTags - tags from either the article or gallery
     *   which should be appended
     * @returns {string}
     */
    getTags: (pageData = {}, contentTags = []) => {
      const { page, pageName } = pageData;

      switch (page) {
        case 'article':
        case 'vgallery':
          return [pageName, ...contentTags];
        case 'events':
        case 'contests':
          return [pageName];
        case 'homepage':
        case 'stationFront':
          return [pageTypeTagSection, pageTypeHomepage];
        case 'sectionFront':
        case 'stationSectionFront':
          return ['sectionfront', ...pageName.split('_')];
        case 'stationsDirectory':
          return [pageTypeTagStationsDirectory, pageName];
        case 'stationDetail':
          return [pageTypeTagStationDetail, 'unity'];
        case 'topicPage':
          return [pageTypeTagTag, pageTypeTagSection, pageName];
        case 'authorPage':
          return [pageTypeTagArticle, pageTypeTagAuthor];
        default:
          return [];
      }
    },
    /**
     * @returns {boolean}
     */
    isAuthorPage: () => {
      // matches paths found on 'sites/demo/index.js'
      return /^\/authors\/.+$/.test(pathname);
    },
    /**
     * @returns {boolean}
     */
    isHomepage: () => {
      return stripOuterSlashes(pathname) === '';
    },
    /**
     * @returns {boolean}
     */
    isStationDetail: () => {
      // matches path '/:dynamicStation/listen' found on 'sites/demo/index.js'
      return /^\/[^/]+\/listen$/.test(pathname);
    },
    /**
     * @returns {boolean}
     */
    isStationsDirectory: () => {
      return pathname === '/stations' || _startsWith(pathname, '/stations/');
    },
    /**
     * @returns {boolean}
     */
    isTopicPage: () => {
      // matches paths found on 'sites/demo/index.js'
      return /^\/(.*\/)?topic\/.+$/.test(pathname);
    }
  };

  return api;
};
