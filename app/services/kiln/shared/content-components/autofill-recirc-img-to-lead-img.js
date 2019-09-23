'use strict';

const KilnInput = window.kiln.kilnInput,
  { getComponentName } = require('clayutils'),
  _get = require('lodash/get');

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
      const pageState = kilnInput.getState(),
        {
          page: {
            data: {
              main: [mainComponentRef]
            }
          }
        } = pageState,
        {
          uri: currentUri,
          data: {
            url: leadImgUrl
          }
        } = payload,
        componentName = getComponentName(currentUri),
        isImageComponent = componentName === 'image';

      if (!isImageComponent) {
        return;
      }

      // eslint-disable-next-line one-var
      const componentData = await kilnInput.getComponentData(mainComponentRef),
        isLeadComponent = _get(componentData.lead[0], '_ref') === currentUri,
        noFeedImageSet = !componentData.feedImgUrl;

      if (isLeadComponent && noFeedImageSet) {
        setToLeadImage(mainComponentRef, leadImgUrl);
      }
    };

  kilnInput.subscribe('UPDATE_COMPONENT', setFeedImgUrlIfEmpty);
};
