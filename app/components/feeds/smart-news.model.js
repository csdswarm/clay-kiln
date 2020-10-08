'use strict';

const parseDate = require('date-fns/parse'),
  isEmpty = require('lodash/isEmpty'),
  rendererPipeline = require('./renderer-pipeline');

/**
 * @param  {String} ref
 * @param  {Object} data
 * @param  {Object} locals
 * @return {Promise}
 */
module.exports = (ref, data, locals) => {
  setChannelPubDate(data);

  return rendererPipeline(ref, data, locals, 'smart-news');
};

/**
 * Unfortunately pubDate is required by smart news even though its use-case
 * doesn't fit ours.  Here's the spec for what pubDate means
 *
 * http://www.rssboard.org/rss-specification#optionalChannelElements
 *
 * Ideally instead we'd be able to send 'lastBuildDate' which makes more sense
 * for us.  The difference between the two is summarized here:
 * https://stackoverflow.com/a/17365393
 *
 * @param {object} data
 */
function setChannelPubDate(data) {
  if (isEmpty(data.results)) {
    return;
  }

  // the content's `date` field is the published date.
  //
  // amphora-rss adds the contents of 'opt' as a child to the to the channel
  //   element.  see the amphora-rss code for details
  //
  // finally, smart news requires an rfc822 compatible date format, which is
  //   provided by toUTCString.  It also ideally would be in GMT
  //   https://publishers.smartnews.com/hc/en-us/articles/360010977793#date-format-of-lt-pubdate-gt
  data.meta.opt.push({
    pubDate: parseDate(data.results[0].date).toUTCString()
  });
}
