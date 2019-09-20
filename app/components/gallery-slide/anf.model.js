'use strict';

// https://developer.apple.com/documentation/apple_news/component
// https://developer.apple.com/documentation/apple_news/apple_news_format/components

const log = require('../../services/universal/log').setup({ file: __filename }),
  { isNotHTMLEmbed } = require('../../services/universal/contentAppleNews'),
  { getComponentInstance: getCompInstanceData } = require('../../services/server/publish-utils'),
  /**
   * Returns slide description in ANF if it exists
   *
   * @param {string} description
   * @returns {Object}
   */
  getSlideDescriptionIfExists = description => {
    if (description) {
      return {
        role: 'caption',
        text: description.text,
        style: 'slideDescriptionStyle',
        textStyle: 'slideDescriptionTextStyle',
        layout: 'slideDescriptionLayout'
      };
    }
  },
  /**
   * Get apple news format of slide ref
   *
   * @param {Object} slide
   * @returns {Promise|Object}
  */
  getSlideEmbed = async slide => {
    let slideANF = {};

    if (isNotHTMLEmbed(slide._ref)) {
      try {
        slideANF = await getCompInstanceData(`${ slide._ref }.anf`);
      } catch (e) {
        log('error', `Error getting component instance data
        for ${ slide._ref } anf: ${e}`);
      };
    }

    return slideANF;
  };

module.exports = async function (ref, data) {
  return {
    role: 'container',
    style: 'gallerySlideStyle',
    layout: 'gallerySlideLayout',
    components: [
      {
        role: 'heading2',
        text: data.title,
        style: 'slideTitleStyle',
        textStyle: 'slideTitleTextStyle',
        layout: 'slideTitleLayout'
      },
      getSlideDescriptionIfExists(data.description),
      await getSlideEmbed(data.slideEmbed[0])
    ]
  };
};
