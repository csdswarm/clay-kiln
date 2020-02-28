'use strict';

const KilnInput = window.kiln.kilnInput,
  { getComponentName } = require('clayutils'),
  rest = require('../../../universal/rest'),
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
    setToLeadImage = (refToUpdate, leadImgUrl) => kilnInput.saveComponent(
      refToUpdate,
      { url: leadImgUrl }
    ),
    /**
     * Sets the feed image url to the lead image url if it has not already been set
     * @param {Object} payload
     */
    setFeedImgUrlIfEmpty = async (payload = defaultPayload) => {
      const pageState = kilnInput.getState(),
        {
          components,
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
      const mainComponentData = components[mainComponentRef],
        { feedImg } = mainComponentData,
        leadComponentRef = _get(mainComponentData, 'lead.0._ref'),
        shouldCheckForEmptyFeedImg = currentUri === leadComponentRef;

      if (shouldCheckForEmptyFeedImg) {
        const feedImgData = await rest.get(`http://${feedImg._ref}`),
          hasUrl = Boolean(feedImgData.url);

        if (hasUrl) {
          return;
        }

        setToLeadImage(feedImg._ref, leadImgUrl);
      }
    };

  kilnInput.subscribe('UPDATE_COMPONENT', setFeedImgUrlIfEmpty);
};
