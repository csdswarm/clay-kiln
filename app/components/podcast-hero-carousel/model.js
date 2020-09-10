'use strict';

const { unityComponent } = require('../../services/universal/amphora');

module.exports = unityComponent({
  /**
   * Updates the data for the template prior to render
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  render: (uri, data) => {
    data._computed.showControls = data.slides.length > 1;
    data._computed.defaults = {
      backgroundColor: '#f2f2f2',
      textColor: '#000000'
    };
    return data;
  }
});