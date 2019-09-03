'use strict';

// https://developer.apple.com/documentation/apple_news/component
// https://developer.apple.com/documentation/apple_news/apple_news_format/components

const { formatSimpleByline } = require('../../services/universal/byline'),
  formatBylines = bylines => {
    const bylineHTML = '';

    bylines.forEach(byline => {
      bylineHTML.push(`${ byline.prefix } `);
      bylineHTML.push(formatSimpleByline(byline.names));
      byline.sources.forEach(source => {
        bylineHTML.push(`, ${ source.text }`);
      });
    });

    return bylineHTML;
  };

module.exports = function (ref, data, locals) {
  return {
    role: 'container',
    style: 'headerStyle',
    layout: 'headerLayout',
    components: [
      {
        role: 'title',
        text: data.primaryHeadline,
        layout: 'headlineLayout',
        style: 'headlineStyle',
        textStyle: 'headlineTextStyle',
        format: 'html'
      },
      {
        role: 'author',
        text: formatBylines(data.byline),
        layout: 'bylineLayout',
        style: 'bylineStyle',
        textStyle: 'bylineTextStyle',
        format: 'html'
      }
    ]
  };
};
