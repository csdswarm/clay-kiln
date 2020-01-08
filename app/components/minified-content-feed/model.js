const
  defaultSearch = require('../../services/server/feeds/default-search'),
  defaultTransform = require('../../services/universal/feeds/default-xform'),
  { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  async render(ref, data, locals) {
    const content = await defaultSearch(data, locals),
      options = {
        track: {
          type: 'feedItem-link',
          'component-name': 'minified-content-feed',
          'component-title': 'Minified Content Feed'
        },
        fields: ['category']
      };

    data._computed.cards = defaultTransform('minified', data, content, options);
  }
});
