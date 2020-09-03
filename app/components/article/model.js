'use strict';

const _get = require('lodash/get'),
  { unityComponent } = require('../../services/universal/amphora'),
  createContent = require('../../services/universal/create-content'),
  { autoLink } = require('../breadcrumbs'),
  defaultTextWithOverride = {
    onModelSave: require('../../services/kiln/plugins/default-text-with-override/on-model-save')
  },
  { ARTICLE_AD_INSERT_EVERY, CLAY_SITE_HOST: host } = process.env,
  /**
   * Inject ads every nth index to content array
   * @param {object} data
   * @returns {Void}
   */
  injectAdsToArticleContent = data => {
    const insertEvery = +ARTICLE_AD_INSERT_EVERY,
      content = data.content;

    // There should be at least 2 components below where's going to be inserted the ad slot
    if (content.length > insertEvery + 1) {
      /**
       * Start on the position that we want to place the ad slot + 1 to make sure there are at least 2 components below
       * where the ad slot would be inserted, then insert it 1 position above where we started, then sum 1 to the next iteration's
       * position to take into account newly added ad slot component.
       */
      for (let i = insertEvery + 1; i < content.length; i += insertEvery + 1) {
        // Don't inject if there's already a published ad.
        if (!content[i - 1]._ref.includes(`${host}/_components/google-ad-manager/instances/mediumRectangleContentBody`)) {
          content.splice(i - 1, 0, {
            _ref: `${host}/_components/google-ad-manager/instances/mediumRectangleContentBody`
          });
        }
      }
    }
  },
  /**
   * Remove ads injected on article content
   * @param {object} data
   * @returns {Void}
   */
  removeAdsFromArticleContent = data => {
    data.content = data.content.filter(
      component => !component._ref.includes('/_components/google-ad-manager/instances/mediumRectangleContentBody')
    );
  };

module.exports = unityComponent({
  render: async (uri, data, locals) => {
    locals.loadedIds.push(uri);
    await autoLink(data, [
      'sectionFront',
      'secondarySectionFront'
    ], locals);

    if (!locals.edit) {
      injectAdsToArticleContent(data);
    }

    await createContent.render(uri, data, locals);
    return data;
  },
  save: async (uri, data, locals) => {
    data.dateModified = (new Date()).toISOString();

    defaultTextWithOverride.onModelSave.handleDefault('msnTitle', 'headline', data);
    data.msnTitleLength = _get(data.msnTitle, 'length', 0);

    removeAdsFromArticleContent(data);

    await createContent.save(uri, data, locals);
    return data;
  }
});

module.exports._internals = {
  injectAdsToArticleContent,
  removeAdsFromArticleContent
};
