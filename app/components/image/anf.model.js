'use strict';

/** https://developer.apple.com/documentation/apple_news/apple_news_format/components
 *  https://developer.apple.com/documentation/apple_news/image
*/

const htmlSpaces = (count = 0) => new Array(count).fill(0)
  .reduce((spaces) => `${spaces}&nbsp;`, '');

module.exports = function (ref, data) {
  const { url, caption, credit } = data,
    creditsContent = credit ? `<span data-anf-textstyle="metaStyle">Photo credit ${credit}</span>` : '';

  return {
    role: 'container',
    components: [
      {
        role: 'image',
        URL: url,
        caption: caption,
        layout: 'imageLayout'
      },
      ...caption
        ? [{
          role: 'caption',
          text: `${caption}${htmlSpaces(4)}${creditsContent}`,
          textStyle: {
            fontName: 'Avenir-Roman',
            fontSize: 12,
            lineHeight: 16,
            textAlignment: 'left'
          },
          layout: 'captionLayout',
          format: 'html'
        }]
        : []
    ]
  };
};
