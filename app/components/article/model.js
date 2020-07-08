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
   * @param {object} dataWithContent
   * @returns {Void}
   */
  injectAdsToArticleContent = async (dataWithContent) => {
    const insertEvery = +ARTICLE_AD_INSERT_EVERY;

    if (dataWithContent.content.length > 4) {
      for (let i = insertEvery; i < dataWithContent.content.length; i += insertEvery + 1) {
        dataWithContent.content.splice(i, 0, {
          _ref: `${host}/_components/google-ad-manager/instances/mediumRectangleBottom`
        });
      }
    }
  };



module.exports = unityComponent({
  render: async (uri, data, locals) => {
    locals.loadedIds.push(uri);
    await autoLink(data, [
      'sectionFront',
      'secondarySectionFront'
    ], locals);
    const dataWithContent = await createContent.render(uri, data, locals);
    
    if (!locals.edit) {
      injectAdsToArticleContent(dataWithContent);
    }

    return dataWithContent;
  },
  save: async (uri, data, locals) => {
    data.dateModified = (new Date()).toISOString();

    defaultTextWithOverride.onModelSave.handleDefault('msnTitle', 'headline', data);
    data.msnTitleLength = _get(data.msnTitle, 'length', 0);

    await createContent.save(uri, data, locals);

    return data;
  }
});
