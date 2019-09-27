'use strict';

// https://developer.apple.com/documentation/apple_news/component
// https://developer.apple.com/documentation/apple_news/apple_news_format/components

const log = require('../../services/universal/log').setup({ file: __filename }),
  { isNotHTMLEmbed } = require('../../services/universal/contentAppleNews'),
  { getComponentInstance: getCompInstanceData } = require('../../services/server/publish-utils'),
  _get = require('lodash/get'),
  /**
   * Get apple news format of slide ref
   *
   * @param {Object} slide
   * @returns {Promise|Object}
  */
  getSlideEmbed = async slide => {
    if (isNotHTMLEmbed(slide._ref)) {
      try {
        const slideANF = await getCompInstanceData(`${ slide._ref }.anf`),
          { components: [imgComponent, captionComponent] } = slideANF;

        return {
          ...slideANF,
          components: [
            imgComponent,
            {
              ...captionComponent,
              textStyle: {
                ...captionComponent.textStyle,
                textAlignment: 'right'
              }
            }
          ]
        };
      } catch (e) {
        log('error', `Error getting component instance data
        for ${ slide._ref } anf: ${e}`);
      };
    }
  },
  getSlideDescription = async (descriptionRef = '') => {
    try {
      return await getCompInstanceData(`${descriptionRef}.anf`);
    } catch (err) {
      log('error', `Error getting slide description for ${descriptionRef} and: ${err}`);
      return null;
    }
  };

module.exports = async function (ref, data) {
  const { title, description } = data,
    descRef = _get(description[0], '_ref'),
    slideDescription = descRef
      ? await getSlideDescription(descRef)
      : null,
    titleComponent = {
      role: 'heading2',
      text: title,
      textStyle: {
        fontSize: 20,
        lineHeight: 25,
        fontName: 'AvenirNext-Bold'
      },
      layout: {
        margin: {
          bottom: 7
        }
      }
    };

  return {
    role: 'container',
    layout: 'slideGalleryItemLayout',
    components: [
      ...await Promise.all(data.slideEmbed.map(getSlideEmbed)),
      titleComponent,
      ...slideDescription
        ? [slideDescription]
        : []
    ]
  };
};
