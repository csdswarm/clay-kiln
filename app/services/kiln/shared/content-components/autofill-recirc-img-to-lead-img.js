'use strict';

const KilnInput = window.kiln.kilnInput,
  { getComponentName } = require('clayutils'),
  rest = require('../../../universal/rest'),
  _get = require('lodash/get'),
  CLAY_SITE_PROTOCOL = process.env.CLAY_SITE_PROTOCOL;

module.exports = (schema) => {
  const kilnInput = new KilnInput(schema),
    defaultPayload = {
      uri: '',
      data: {
        url: ''
      }
    },
    /**
     * Sets the feedImgUrl to lead image url
     * @param {String} articleRef
     * @param {String} leadImgUrl
     * @returns {Void}
     */
    setFeedImgUrlToLeadImage = (
      articleRef, leadImgUrl
    ) => kilnInput.saveComponent(
      articleRef,
      { feedImgUrl: leadImgUrl },
    ),
    /**
     * Sets the feedImg component's url to lead img url
     * @param {String} feedImgRef
     * @param {String} leadImgProps
     * @returns {Void}
     */
    setFeedImgComponentToLeadImage = (
      feedImgRef, leadImgProps
    ) => kilnInput.saveComponent(
      feedImgRef,
      leadImgProps
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
          data: leadImgProps
        } = payload,
        componentName = getComponentName(currentUri),
        isImageComponent = componentName === 'image';

      if (!isImageComponent) {
        return;
      }

      // eslint-disable-next-line one-var
      const mainComponentData = components[mainComponentRef],
        leadComponentRef = _get(mainComponentData, 'lead.0._ref'),
        shouldCheckForEmptyFeedImg = currentUri === leadComponentRef;

      /**
       * NOTE:
       * Not all content pages have the `feedImg` component, so we need
       * to update depending on whether that component exists.
       */
      if (shouldCheckForEmptyFeedImg) {
        const { leadImgUrl } = leadImgProps,
          { feedImg } = mainComponentData,
          hasFeedImgComponent = feedImg !== undefined;

        if (hasFeedImgComponent) {
          const feedImgData = await rest.get(
              `${CLAY_SITE_PROTOCOL}://${feedImg._ref}`
            ),
            hasUrl = Boolean(feedImgData.url);

          if (!hasUrl) {
            setFeedImgComponentToLeadImage(
              feedImg._ref, leadImgProps,
            );
          }

          return;
        }

        const { feedImgUrl } = mainComponentData;

        if (!feedImgUrl) {
          setFeedImgUrlToLeadImage(
            mainComponentRef, leadImgUrl
          );
        }
      }
    };

  kilnInput.subscribe('UPDATE_COMPONENT', setFeedImgUrlIfEmpty);
};
