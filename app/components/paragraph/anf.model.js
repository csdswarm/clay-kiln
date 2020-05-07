'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/body
*/
const cheerio = require('cheerio');

module.exports = function (_, data) {
  const $ = cheerio.load(data.text),
    /**
     * Wraps the text in an <a> tag with an anf styled span tag for custom styling
     *
     * @param {Object} _ unused
     * @param {Object} el
     */
    addAnfHyperlinkStyleWrapper = (_, el) => {
      const t = $(el).text();

      $(el).html(
        `<span data-anf-textstyle="hyperlinkStyle">${t}</span>`
      );
    };

  $('a').each(addAnfHyperlinkStyleWrapper);

  return {
    role: 'body',
    text: $('body').html(),
    layout: 'bodyItemLayout',
    format: 'html',
    textStyle: {
      lineHeight: 28
    }
  };
};
