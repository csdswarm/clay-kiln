'use strict';

const { unityComponent } = require('../../services/universal/amphora'),
  _get = require('lodash/get'),
  axios = require('axios'),
  logger = require('../../services/universal/log'),
  log = logger.setup({ file: __filename });

module.exports = unityComponent({
  /**
   * Updates the data for the template prior to render
   * small proxy to the postup page because the client cannot access for details
   * in client.js
   *
   * @param {string} uri - The uri of the component instance
   * @param {object} data - persisted or bootstrapped data for this instance
   * @param {object} locals - data that has been attached to express locals for the current page request
   *
   * @returns {object}
   */
  render: (uri, data, locals) => {

    if (!_get(locals, 'postup')) {
      // needed for template to accommodate CSS adjustments on vertical multi-line titles
      const newLineCharCountThreshold = data.layoutType === 'vertical' ? 23 : 60;

      data._computed.isMultilineTitle = data.title.length > newLineCharCountThreshold;
      return data;
    }

    if (_get(locals, 'postup')) {
      const params = {
        action: 'easySignup',
        ...locals.postup,
        importTemplateID: data.postUpImportTemplateId
      };

      if (data.postUpSiteID) {
        params.siteId = data.postUpSiteID;
      }

      return axios({
        method: 'post',
        url: 'http://www.e.radio.com/Subscribe.do',
        params
      })
        .then(r => {
          if (r.data.includes('success')) {
            return { success: true };
          } else {
            log('error', new Error('Error adding to PostUp:'), params);
            return { success: false, params, html: r.data };
          }
        })
        .catch(err => {
          log(err);
          return { success: false, params, error: err };
        });
    }
  }
});
