'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/articlelink
 *  https://developer.apple.com/documentation/apple_news/articlethumbnail
 *  https://developer.apple.com/documentation/apple_news/articletitle
*/

const { getPageInstance } = require('clayutils'),
  /**
   * get Apple News format for all inline related items
   *
   * @param {Object} content
   * @returns {Array}
  */
  getInlineRelated = content => {
    const inlineRelatedANF = [];

    content.forEach(contentInstance => {
      inlineRelatedANF.push({
        role: 'article_link',
        articleIdentifier: getPageInstance(contentInstance.pageUri).replace('@published', ''),
        layout: 'inlineRelatedLayout',
        style: 'inlineRelatedStyle',
        components: [
          {
            role: 'article_thumbnail',
            layout: 'inlineRelatedThumbnailLayout',
            style: 'inlineRelatedThumbnailStyle'
          },
          {
            role: 'article_title',
            textStyle: 'inlineRelatedTextStyle',
            style: 'inlineRelatedTitleStyle',
            layout: 'inlineRelatedTitleLayout',
            format: 'html'
          }
        ]
      });
    });

    return inlineRelatedANF;
  }

module.exports = function (ref, data, locals) {
  return getInlineRelated(data.articles);
};
