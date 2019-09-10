'use strict';

const KilnInput = window.kiln.kilnInput,
  { getComponentName } = require('clayutils');

module.exports = (schema) => {
  const kilnInput = new KilnInput(schema),
    defaultPayload = {
      uri: '',
      data: {
        url: ''
      }
    },
    /**
     * Save feedImgUrl to component model
     * @param {String} articleRef
     * @param {String} leadImgUrl
     * @returns {Void}
     */
    setToLeadImage = (articleRef, leadImgUrl) => kilnInput.saveComponent(
      articleRef,
      { feedImgUrl: leadImgUrl }
    ),
    /**
     * Sets the feed image url to the lead image url if it has not already been set
     * @param {Object} payload
     */
    setFeedImgUrlIfEmpty = async (payload = defaultPayload) => {
      const {
          uri,
          data: {
            url: leadImgUrl
          }
        } = payload,
        componentName = getComponentName(uri),
        isFromLeadImageComponent = componentName === 'image';

      if (isFromLeadImageComponent) {
        const [articleRef] = kilnInput.getComponentInstances('article'),
          articleData = await kilnInput.getComponentData(articleRef),
          noFeedImageSet = !articleData.feedImgUrl;

        if (noFeedImageSet) {
          setToLeadImage(articleRef, leadImgUrl);
        }
      }
    };

  kilnInput.subscribe('UPDATE_COMPONENT', setFeedImgUrlIfEmpty);

  return schema;
};
