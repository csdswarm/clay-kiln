'use strict';

/**
 * initialize APS
 * https://ams.amazon.com/webpublisher/uam/docs/web-integration-documentation/integration-guide/javascript-guide/display.html
 * The library is loaded async via xhr, so we need to wait for it to finish loading
 * @param {integer} pubID
 */
const initAPS = (pubID) => {
    if (window.apstag) {
      window.apstag.init({
        pubID,
        adServer: 'googletag',
        simplerGPT: true
      });
    } else {
      setTimeout(() => initAPS(pubID), 500);
    }
  },
  /**
   * Setup bid options parameter for fetchBids
   * @param {object} params
   * @param {object} params.bidOptions
   * @param {number} params.timeout
   * @returns {object}
   */
  setupBidOptions = (params) => {
    const { bidOptions, timeout } = params,
      options = {
        slots: [],
        timeout: timeout
      };

    for (const optionId of Object.keys(bidOptions)) {
      const option = bidOptions[optionId],
        sizes = option.getSizes();

      options.slots.push({
        slotID: optionId,
        slotName: `${option.getAdUnitPath()}/${optionId.replace('google-ad-manager__slot--', '')}`,
        sizes: sizes.map(size => [ size.getWidth(), size.getHeight() ])
      });
    }

    return options;
  },
  /**
   * fetch bids from APS
   * @param {object} bidOptions
   * @param {function} callback
   */
  fetchAPSBids = (bidOptions, callback) => {
    const { fetchBids, setDisplayBids } = window.apstag;

    fetchBids(setupBidOptions(bidOptions), () => {
      setDisplayBids();

      // Run code from client.js after bids are fetched, and targeting is set
      callback();
    });
  };

module.exports = {
  initAPS,
  fetchAPSBids
};
