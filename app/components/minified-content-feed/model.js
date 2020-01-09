'use strict';

const
  defaultTransform = require('../../services/universal/feeds/default-xform'),
  { getItemsWithValidation, getList } = require('../../services/server/feeds/default-search'),
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  async save(ref, data, locals) {

    data.curatedItems = await getItemsWithValidation(ref, data.curatedItems, locals);

    return data;
  },
  async render(ref, data, locals) {
    const content = await getList(data, locals),
      options = {
        track: {
          type: 'feedItem-link',
          'component-name': 'minified-content-feed',
          'component-title': 'Minified Content Feed'
        },
        fields: ['category']
      };

    data._computed.cards = defaultTransform('minified', data, content, options);

    return data;
  }
});
