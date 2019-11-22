'use strict';

/**
* Setup parameters for fetchBids
* @param {object} params
* @param {object} params.bidOptions
* @param {number} params.bidTimeout
* @returns {object}
*/
const setupBidOptions = (params) => {
  const { bidOptions, bidTimeout: timeout } = params,
    slots = Object.keys(bidOptions)
      .filter(key => bidOptions.hasOwnProperty(key))
      .map(optionId => {
        const option = bidOptions[optionId],
          sizes = option.getSizes();

        return {
          slotID: optionId,
          slotName: `${option.getAdUnitPath()}/${optionId.replace('google-ad-manager__slot--', '')}`,
          sizes: sizes.map(size => [ size.getWidth(), size.getHeight() ])
        };
      });

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
    this._bidTimeout = bidTimeout;
    this._loadTimeout = loadTimeout;
    this._loadStart = new Date();
    this._pubID = pubID;
    this._initialized = false;

    this.initAmazonApstag();
  }

  /**
   * initialize APS
   * https://ams.amazon.com/webpublisher/uam/docs/web-integration-documentation/integration-guide/javascript-guide/display.html
   * The library is loaded async via xhr, so we need to wait for it to finish loading
   */
  initAmazonApstag() {
    const { _pubID, _loadStart, _loadTimeout } = this,
      self = this,
      now = new Date();

    if (window.apstag) {
      this._initialized = true;

      window.apstag.init({
        pubID: _pubID,
        adServer: 'googletag',
        simplerGPT: true
      });
    } else {
      if ((now - _loadStart) < _loadTimeout) {
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
    const { _initialized, _bidTimeout: bidTimeout } = this;

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
