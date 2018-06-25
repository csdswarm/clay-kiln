'use strict';

const _includes = require('lodash/includes'),
  parse = require('url-parse'),
  rest = require('../../services/universal/rest'),
  sanitize = require('../../services/universal/sanitize'),
  videos = require('../../services/universal/video-embeds'),
  nonVideoRegex = require('./non-video-regex'),
  EMBEDLY_ENDPOINT = process.env.EMBEDLY_ENDPOINT,
  EMBEDLY_KEY = process.env.EMBEDLY_KEY;

/**
 * parse the the response from embedly
 * @param  {string} url
 * @return {function}
 */
function parseEmbedlyData(url) {
  return function (data) {
    // embed.ly can only handle a certain subset of urls
    // if it can't embed something, it'll return a `link` instead of `video`
    if (data.html) {
      // Strip width and height off of the iframe, so we can make it responsive
      return {
        html: data.html.replace(/width=\"[0-9]+\"/ig, '').replace(/height=\"[0-9]+\"/ig, ''),
        url: url,
        videoValid: true
      };
    } else {
      // we'll have to deal with it ourselves. it's probably a straight-up embed url
      // this will dump it into a generic (responsive) iframe in the template
      return {
        url: url,
        videoValid: true
      };
    }
  };
}

/**
 * generate embed html
 * @param {string} url
 * @returns {Promise}
 */
function generateEmbedHtml(url) {
  // handle our own, custom video embeds
  if (_includes(url, 'youtube.com') || _includes(url, 'youtu.be')) {
    return Promise.resolve({
      html: videos.youtube(url),
      url: url,
      videoValid: true
    });
  } else if (_includes(url, 'videos.nymag.com') || _includes(url, 'video.vulture.com')) {
    // we handle our magnify/wayfire embeds ourselves, since their oembed implementation doesn't play nice with others
    return Promise.resolve({
      html: videos.magnify(url),
      url: url,
      videoValid: true
    });
  } else if (nonVideoRegex.match(url)) {
    // the url matches something embedly knows is NOT a video!
    return Promise.resolve({
      html: '',
      url,
      videoValid: false
    });
  } else {
    // try to get the video from embedly
    return rest.get(EMBEDLY_ENDPOINT + '?key=' + EMBEDLY_KEY + '&url=' + url)
      .then(parseEmbedlyData(url))
      .catch(() => {
        return { html: '', url, videoValid: false };
      });
  }
}

module.exports.render = function (uri, data) {
  const {url} = data,
    parsed = parse(url, true),
    query = parsed.query;

  try {
    if (!parsed || !parsed.hostname) {
      throw new Error('Video URL was unparseable');
    }

    if (!_includes(parsed.hostname, 'youtu')) {
      throw new Error('URL was not a Youtube url');
    }

    data.youtubeId = videos.getYoutubeID(parsed, query);
  } catch (err) {
    data.youtubeId = '';
  }

  return data;
};

/**
 * embed youtube/nymag, embedly-compatible, or straight-up iframed videos
 * @param  {string} uri
 * @param  {object} data
 * @return {Promise}
 */
module.exports.save = function (uri, data) {
  let url = data.url,
    embedCode = url && url.match(/src=['"](.*?)['"]/i); // find first src="(url)"

  // if they pasted in a full embed code, parse out the url
  if (embedCode) {
    url = embedCode[1];
  }

  if (url) {
    // remove any HTML tags that may have been carried over when pasting from google docs
    url = sanitize.toPlainText(url);
    // Do not change data.html if the current url matches the url that previously generated data.html
    if (data.lastGenerated === url) {
      return Promise.resolve(data);
    }
    // Generate new html
    return generateEmbedHtml(url)
      .then(data => {
        if (data.videoValid) {
          data.lastGenerated = url;
        }

        return data;
      });
  } else {
    data.html = '';
    data.lastGenerated = '';
    data.videoValid = true;
    return Promise.resolve(data);
  }
};
