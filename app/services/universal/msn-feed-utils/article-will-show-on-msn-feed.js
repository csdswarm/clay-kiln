'use strict';

/**
 * Determines whether an article will display on the msn feed.  This is used to
 *   store the last published date in redis so our msn feed endpoint can return
 *   a 304 when appropriate.
 *
 * Important: this logic should be in sync with the query found in the 'msn'
 *   instance of the feeds component.  The title length requirement additionally
 *   needs to be in sync with article/schema.yml -> msnTitle's validator
 *
 * @param {object} data
 * @returns {boolean}
 */
module.exports = data => {
  // title length requirement found here
  // https://partnerhub.msn.com/docs/spec/vcurrent/article-metadata/AAsCd
  return data.msnTitleLength > 20
    && data.feeds.msn
    && data.noIndexNoFollow !== true
    && data.byline.every(isntFromTheAssociatedPress);
};

// helper functions

function isntFromTheAssociatedPress(entry) {
  return entry.sources.every(({ text }) => text !== 'The Associated Press');
}
