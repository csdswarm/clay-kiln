'use strict';
const isDesktop = require('../../services/client/isDesktop'),
  passesAll = require('lodash/overEvery'),

  // List of filters to run on each slot to be bid on
  filters = [
    // Ensure there are valid sizes for each slot
    ({ sizes }) => sizes.length,

    // Do not bid on mobile ads if the client is a desktop
    ({ slotID }) => isDesktop() ? !slotID.includes('mobile') : true,

    // Do not bid on sponsorship slots
    ({ slotID }) => !slotID.includes('sponsorship')
  ],

  /**
   * Setup parameters for fetchBids
   * @param {object} params
   * @param {object} params.bidOptions
   * @param {number} params.bidTimeout
   * @returns {object}
   */
  setupBidOptions = (params) => {
    const { bidOptions, bidTimeout: timeout } = params,
      slots = Object.keys(bidOptions)
        .map(optionId => {
          const option = bidOptions[optionId],
            sizes = option.getSizes();

          return {
            slotID: optionId,
            slotName: `${option.getAdUnitPath()}/${optionId.replace('google-ad-manager__slot--', '')}`,
            sizes: sizes.map(size => [ size.getWidth(), size.getHeight() ]).filter(([width, height]) => width > 7 && height > 7)
          };
        })
        .filter(passesAll(filters));

    return { slots, timeout };
  };

class ApsTam {
  /**
   * Amazon Publisher Services Transparent Ad Marketplace abstraction
   * @param {string} pubID
   * @param {integer} bidTimeout
   * @param {integer} loadTimeout
   */
  constructor(pubID, bidTimeout, loadTimeout) {
    this.BID_TIMEOUT = bidTimeout;
    this.LOAD_TIMEOUT = loadTimeout;
    this.LOAD_START = new Date();
    this.APS_PUB_ID = pubID;
    this._initialized = false;

    this.initAmazonApstag();
  }

  /**
   * initialize APS
   * https://ams.amazon.com/webpublisher/uam/docs/web-integration-documentation/integration-guide/javascript-guide/display.html
   * The library is loaded async via xhr, so we need to wait for it to finish loading
   */
  initAmazonApstag() {
    const { APS_PUB_ID: pubID, LOAD_START, LOAD_TIMEOUT } = this,
      self = this,
      now = new Date();

    if (window.apstag) {
      this._initialized = true;

      window.apstag.init({
        pubID,
        adServer: 'googletag',
        simplerGPT: true
      });
    } else {
      if ((now - LOAD_START) < LOAD_TIMEOUT) {
        setTimeout(() => self.initAmazonApstag(), 500);
      } else {
        console.warn('Couldn\'t load Amazon Apstag Library');
      }
    }
  }

  /**
   * fetch bids from APS if library is initialized
   * @param {object} bidOptions
   * @param {function} callback
   */
  fetchAPSBids(bidOptions, callback) {
    const { _initialized, BID_TIMEOUT: bidTimeout } = this;

    if (_initialized) {
      const { fetchBids, setDisplayBids } = window.apstag;

      fetchBids(setupBidOptions({ bidOptions, bidTimeout }), () => {
        setDisplayBids.call(window);
        callback();
      });
    } else {
      callback();
    }
  }
}

module.exports = (pubID, loadTimeout, bidTimeout) => new ApsTam(pubID, loadTimeout, bidTimeout);
