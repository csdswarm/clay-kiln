'use strict';

const urlPub = require('./server/publish-url');

/**
 * Adds lastModified to page object
 * @param {object} pageData
 * @returns {object}
 */
function addLastModified(pageData) {
  pageData.lastModified = Date.now();
  return pageData;
}

module.exports.getYearMonthSlugUrl = urlPub.getYearMonthSlugUrl;
module.exports.getGallerySlugUrl = urlPub.getGallerySlugUrl;
module.exports.getArticleSlugUrl = urlPub.getArticleSlugUrl;
module.exports.getSectionFrontSlugUrl = urlPub.getSectionFrontSlugUrl;
module.exports.getContestSlugUrl = urlPub.getContestSlugUrl;
module.exports.getAuthorPageSlugUrl = urlPub.getAuthorPageSlugUrl;
module.exports.getEventSlugUrl = urlPub.getEventSlugUrl;
module.exports.getEventsListingUrl = urlPub.getEventsListingUrl;
module.exports.getStationFrontSlugUrl = urlPub.getStationFrontSlugUrl;
module.exports.getPodcastFrontSlugUrl = urlPub.getPodcastFrontSlugUrl;
module.exports.addLastModified = addLastModified;
module.exports.getHostPageSlugUrl = urlPub.getHostPageSlugUrl;
