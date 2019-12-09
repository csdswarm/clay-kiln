'use strict';

// https://developer.apple.com/documentation/apple_news/component
// https://developer.apple.com/documentation/apple_news/apple_news_format/components

const log = require('../../services/universal/log').setup({ file: __filename }),
  { ANF_EMPTY_COMPONENT } = require('../../services/universal/contentAppleNews/constants'),
  { isEmptyComponent } = require('../../services/universal/contentAppleNews/utils'),
  { isNotHTMLEmbed } = require('../../services/universal/contentAppleNews'),
  { getComponentInstance: getCompInstanceData } = require('../../services/server/publish-utils'),
  qs = require('qs'),
  componentProps = qs.stringify({
    textStyle: {
      textAlignment: 'right'
    }
  }),
  _get = require('lodash/get'),
  /**
   * Get apple news format of slide ref
   *
   * @param {Object} slide
   * @returns {Promise|Object}
  */
  getSlideEmbed = async slide => {
    const { _ref } = slide;

    if (isNotHTMLEmbed(_ref)) {
      try {
        return getCompInstanceData(`${ _ref }.anf?${componentProps}`);
      } catch (e) {
        log('error', `Error getting component instance data
        for ${ _ref } anf: ${e}`);
      };
      return ANF_EMPTY_COMPONENT;
    }
  },
  /**
   * @param {String} descriptionRef clay component ref
   * @returns {Object} anf component
   */
  getAnfSlideDescription = (descriptionRef = '') => {
    try {
      return descriptionRef
        ? getCompInstanceData(`${descriptionRef}.anf`)
        : ANF_EMPTY_COMPONENT;
    } catch (err) {
      log('error', `Error getting slide description for ${descriptionRef} and: ${err}`);
    }
    return ANF_EMPTY_COMPONENT;
  };

module.exports = async function (ref, data) {
  const { title, description } = data,
    descRef = _get(description[0], '_ref'),
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
    },
    slideEmbed = await getSlideEmbed(data.slideEmbed[0]);

  if (isEmptyComponent(slideEmbed)) {
    return ANF_EMPTY_COMPONENT;
  }

  return {
    role: 'container',
    layout: 'slideGalleryItemLayout',
    components: [
      slideEmbed,
      titleComponent,
      await getAnfSlideDescription(descRef)
    ]
  };
};
