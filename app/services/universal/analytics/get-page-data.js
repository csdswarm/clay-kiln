'use strict';

const { stripOuterSlashes } = require('../pathname-utils'),
  makeFromPathname = require('./make-from-pathname');

/**
 * @typedef {object} PageData
 * @property {string} page
 * @property {string} [pageName]
 */

/**
 * Returns data related to the page which we use to determine other
 * tracking data.
 * @param {string} pathname
 * @param {?string} contentType
 * @returns {PageData}
 */
module.exports = (pathname, contentType) => {
  const fromPathname = makeFromPathname({ pathname }),
    innerPathname = stripOuterSlashes(pathname);

  let page,
    pageName;

  if (fromPathname.isHomepage()) {
    page = 'homepage';
  } else if (contentType === 'article') {
    page = pageName = 'article';
  } else if (contentType === 'gallery') {
    page = pageName = 'vgallery';
  } else if (fromPathname.isStationsDirectory()) {
    page = 'stationsDirectory';
    pageName = innerPathname.replace('/', '_');
  } else if (fromPathname.isStationDetail()) {
    page = 'stationDetail';
    pageName = innerPathname.split('/')[0];
  } else if (fromPathname.isTopicPage()) {
    page = 'topicPage';
    pageName = innerPathname.replace(/[^\/]+\//, '');
  } else if (fromPathname.isAuthorPage()) {
    page = 'authorPage';
    pageName = innerPathname.replace('/', '_');
  } else {
    page = 'sectionFront';
    pageName = innerPathname;
  }

  return {
    page,
    pageName
  };
};
