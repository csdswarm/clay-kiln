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
 * @param {?string} site_slug
 * @returns {PageData}
 */
module.exports = (pathname, contentType, site_slug) => {
  const fromPathname = makeFromPathname({ pathname }),
    innerPathname = stripOuterSlashes(pathname),
    isAStationSectionFront = innerPathname.split('/').length > 1; // wearechannelq -> sectionFront , wearechannelq/music/pop -> stationSectionFront
  
  let page,
    pageName;

  if (fromPathname.isHomepage()) {
    page = 'homepage';
  } else if (contentType === 'article') {
    page = pageName = 'article';
  } else if (contentType === 'gallery') {
    page = pageName = 'vgallery';
  } else if (contentType === 'contest') {
    page = pageName = 'contests';
  } else if (contentType === 'event') {
    page = pageName = 'events';
  } else if (fromPathname.isStationsDirectory()) {
    page = 'stationsDirectory';
    pageName = innerPathname.replace('/', '_');
  } else if (fromPathname.isStationDetail()) {
    page = 'stationDetail';
    pageName = innerPathname.split('/')[0];
  } else if (fromPathname.isTopicPage()) {
    page = 'topicPage';
    pageName = innerPathname.replace(/[^\/]+\//g, '');
  } else if (fromPathname.isAuthorPage()) {
    page = 'authorPage';
    pageName = 'authors';
  } else if (site_slug && isAStationSectionFront) {
    page = 'stationSectionFront';
    pageName = innerPathname.split('/').slice(1).join('_');
  } else if (site_slug && !isAStationSectionFront) {
    page = 'stationFront';
    pageName = innerPathname;
  } else {
    page = 'sectionFront';
    pageName = innerPathname.split('/').join('_');
  }

  return {
    page,
    pageName
  };
};
