'use strict';

/* eslint-disable one-var */

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/facebookpost
*/

const { ANF_EMPTY_COMPONENT } = require('../../services/universal/contentAppleNews/constants');
const validPatterns = new RegExp(
  [
    // https://www.facebook.com/{page-name}/posts/{post-id}
    // https://www.facebook.com/{username}/posts/{post-id}
    new RegExp(/^https:\/\/www\.facebook.com\/[\w\d-]+?\/posts\/[\d]+?/),
    // https://www.facebook.com/{username}/activity/{activity-id}
    new RegExp(/^https:\/\/www\.facebook.com\/[\w\d-]+?\/activity\/[\d]+?/),
    // https://www.facebook.com/photo.php?fbid={photo-id}
    new RegExp(/^https:\/\/www\.facebook.com\/photo\.php\?fbid=[\d]+?/),
    // https://www.facebook.com/photos/{photo-id}
    new RegExp(/^https:\/\/www\.facebook.com\/photos\/[\d]+/),
    // https://www.facebook.com/permalink.php?story_fbid={post-id}
    new RegExp(/^https:\/\/www\.facebook.com\/permalink\.php\?story_fbid=[\d]+/)
  ]
    .map(({ source }) => source)
    .join('|')
);
/**
 * Validates the url for compatibility with apple news facebook_post component
 *
 * @param {String} url
 * @return {Bool}
 */
const isValidUrl = url => validPatterns.test(url);
/**
 * Generates an apple news component data structure
 *
 * @param {String} URL
 * @param {String} role
 * @return {Object}
 */
const anfComponent = (URL, role) => ({
  role,
  URL,
  layout: 'bodyItemLayout'
});
/**
 * Translates a cms facebook photo url to a facebook post url for apple news compatibility
 *
 * @param {String} url
 * @return {Object}
 */
const translatePhotoUrlToPostUrl = (url) => {
  const fragments = url.replace('https://www.facebook.com/', '').split('/'),
    [pageName,,,postId] = fragments;

  return `https://www.facebook.com/${pageName}/posts/${postId}`;
};

module.exports = (
  ref,
  data,
  locals,
  log = require('../../services/universal/log').setup({ file: __filename })
) => {
  const { url } = data;

  if (isValidUrl(url)) {
    return anfComponent(url, 'facebook_post');
  }

  const isVideo = /^https:\/\/www\.facebook.com\/[\w]+?\/videos/.test(url);

  // facebook videos wont't play in apple news
  if (isVideo) {
    log('error', 'facebook videos are not supported', { url });
    return ANF_EMPTY_COMPONENT;
  }

  // https://www.facebook.com/{page-name}/photos/a.{some-id}/{post-id} (pasted in from users)
  const isCmsPhotoUrl = /^https:\/\/www\.facebook.com\/[\w\d-]+?\/photos\/a\.[\d]+?\/[\d]+/.test(url);

  if (isCmsPhotoUrl) {
    return anfComponent(
      translatePhotoUrlToPostUrl(url),
      'facebook_post'
    );
  }

  log('error', 'unsupported facebook url', { url });
  return ANF_EMPTY_COMPONENT;
};

