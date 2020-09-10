'use strict';

const utils = require('../../services/universal/podcast'),
  { unityComponent } = require('../../services/universal/amphora');

/**
 * @param {string} ref
 * @param {object} data
 * @returns {Promise}
 */
module.exports = unityComponent({
  async render(ref, data) {
    data._computed.items = data.items
      .filter(({ podcast }) => !!podcast)
      .map(({ podcast }) => {
        const {
          imageUrl,
          url,
          title,
          category,
          description,
          customDescription,
          shouldOverrideDescription,
          customCategoryLabel,
          shouldOverrideCategoryLabel
        } = podcast;
        
        return {
          title,
          url,
          imageUrl: imageUrl ? utils.createImageUrl(imageUrl) : '',
          description: shouldOverrideDescription ? customDescription : description,
          label: shouldOverrideCategoryLabel ? customCategoryLabel : category.name
        };
      });
    return data;
  }
});
