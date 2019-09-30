'use strict';

// https://developer.apple.com/documentation/apple_news/component
// https://developer.apple.com/documentation/apple_news/apple_news_format/components

const log = require('../../services/universal/log').setup({ file: __filename }),
  { isNotHTMLEmbed } = require('../../services/universal/contentAppleNews'),
  { getComponentInstance: getCompInstanceData } = require('../../services/server/publish-utils'),
  /**
   * Get description text of slide
   *
   * @param {Array} description
   * @returns {Promise|string}
  */
  getDescription = async description => {
    const { text } = await getCompInstanceData(description[0]._ref);

    return text;
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
  const description = await getDescription(data.description);

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
      ...description ? [{
        role: 'caption',
        text: description,
        style: 'slideDescriptionStyle',
        textStyle: 'slideDescriptionTextStyle',
        layout: 'slideDescriptionLayout'
      }] : [],
      ...data.slideEmbed[0] ? [await getSlideEmbed(data.slideEmbed[0])] : []
    ]
  };
};
